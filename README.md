# magda-configmap-dir-loader

A k8s init container docker image to deserialise files with directory structure from multiple k8s configMaps.

A helm chart template [magda.filesToJson](https://github.com/magda-io/magda/blob/21499b75c7a7ee00d68886338713217d83ccb91f/deploy/helm/magda-core/templates/_helpers.tpl#L244) is provided to load files with directory structure into a k8s configMap.

This template support 2 parameters:
- `filePattern`: Glob file search pattern string. All files (and their dir path) match the `Glob` pattern will be encoded and included in the configMap.
- `pathPrefix` : Optional. Add `pathPrefix` to all file path generated in configMap JSON.

Example Usage:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: "my-default-files"
data:
  my_default_files.json: {{ include "magda.filesToJson" (dict "root" . "filePattern" "my_dir/**/*" ) }}
```

Or with `pathPrefix`:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: "my-default-files"
data:
  my_default_files.json: {{ include "magda.filesToJson" (dict "root" . "filePattern" "my_dir/**/*" "pathPrefix" "test/" ) }}
```
