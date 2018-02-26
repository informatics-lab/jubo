```shell
helm install --name=juboapps  --namespace juboapps .
```

Run locally
```
export MARK_AS_REAPABLE_LABEL=jubo-reapable
export MARK_AS_REAPABLE_LABEL_VALUE=yes
export NAME_SPACE=juboapps
python -m jubo.proxy   
```