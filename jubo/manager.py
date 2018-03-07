import os
from kubernetes import client, config
from kubernetes.client.rest import ApiException
from uuid import uuid4 as uuid
import time
import logging
logger = logging.getLogger("jubo")

MARK_AS_REAPABLE_LABEL = os.environ['MARK_AS_REAPABLE_LABEL']
MARK_AS_REAPABLE_LABEL_VALUE = os.environ['MARK_AS_REAPABLE_LABEL_VALUE']
NAME_SPACE =  os.environ['NAME_SPACE']
BOKEH_PORT = 8888
APPS= {}

try:
    config.load_incluster_config()
except kubernetes.config.ConfigException:
    config.load_kube_config()

kube = client.CoreV1Api()


def get_app_info(app_id):
    logger.info('Get app %s if ready' % app_id)
    info = APPS.get(app_id, None)
    if info:
        if check_pod_ready(info['pod']):
            logger.info('Have info for app %s, and pod ready' % app_id)
            return info
        else: 
            logger.info('Have info for app %s, but pod not ready. So delete' % app_id)
            del APPS[app_id]
    
    logger.info('Start up %s' % app_id)
    return start_up_app(app_id)

def check_pod_ready(pod):
    try:
        pod = kube.read_namespaced_pod(pod.metadata.name, pod.metadata.namespace)
        return pod_is_ready(pod)
    except ApiException:
        return False
    

def pod_is_ready(pod):
    ready =  pod.status.phase == 'Running' and pod.status.pod_ip
    logger.info("pod %s is ready? %s " % (pod.metadata.name, ready))
    return ready

def start_up_app(app_id):
    logger.info("Create pod for app %s" % app_id)
    pod = kube.create_namespaced_pod(NAME_SPACE, make_pod_spec(app_id))
    pod = get_pod_once_up(pod)
    info = {
        'app_id':app_id,
        'ip' : pod.status.pod_ip,
        'port': BOKEH_PORT,
        'pod':pod
    }
    APPS[app_id] = info
    logger.info('Started up %s' % app_id)
    return info

def get_pod_once_up(pod):
    timeout = 30
    wait_till = time.time() + timeout
    while time.time() < wait_till:
        pod = kube.read_namespaced_pod(pod.metadata.name, pod.metadata.namespace)
        if pod_is_ready(pod):
            warm_up_time = 5
            logger.info("Pod %s is ready. give it %ss to warm up" % (pod.metadata.name, warm_up_time))
            time.sleep(warm_up_time)
            return pod
        time.sleep(0.5)
    
    logger.info("Time our waiting for pod:\n%s" % pod)
    raise TimeoutError("Waited longer than {timeout}s for pod {pod_name} to be Running.".format(
        timeout=timeout, pod_name=pod.metadata.name
    ))
    

def make_pod_spec(app_id):
    
    pod_name ='app-{app_id}-{uuid}'.format(app_id=app_id, uuid=uuid().hex[:8])
    args = [
        'bokeh',
        'serve',
        '--port',
        str(BOKEH_PORT),
        '/s3/jubo-apps/{}'.format(app_id)
    ]
    s3_volume = client.V1Volume(name='s3', flex_volume=client.V1FlexVolumeSource(
        driver="informaticslab/s3-fuse-flex-volume", 
        options={'readonly':"true"}
    ))
    pod = client.V1Pod(
        metadata=client.V1ObjectMeta(
            name=pod_name,
            labels={MARK_AS_REAPABLE_LABEL:MARK_AS_REAPABLE_LABEL_VALUE}
        ),
        spec=client.V1PodSpec(
            restart_policy='Never',
            containers=[
                client.V1Container(
                    name=pod_name,
                    image='informaticslab/singleuser-notebook:latest',
                    args=args,
                    ports=[client.V1ContainerPort(container_port=BOKEH_PORT, name='bokeh')],
                    volume_mounts=[client.V1VolumeMount(name='s3', mount_path='/s3')]
                )
            ],
            volumes=[s3_volume]
        )
    )
    return pod