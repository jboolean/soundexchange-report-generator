This package contains a node script to simplify icecast2 access logs into the format for the SoundExchange quarterly report.

1. `npm install` in this directory to install dependencies.
2. Locate icecast access logs from the server at /var/log/icecast2 that cover the reporting period.
3. The script reads access logs from stdin and outputs the report in tsv format on stdout. The arguments are the start and end of the reporting period.

```
cat access* | node simplifyAccessLog.js "2019-03-07" "2019-03-20" > report.tsv
```

