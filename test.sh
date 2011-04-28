#/bin/sh
ab -c 50 -n 1000 "http://127.0.0.1:8000/?product=p1&client=c1"
