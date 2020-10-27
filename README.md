# Shot Check

There are a few types of automatic screenshot comparisons the Shot Check Tool can do:

1) Manual Comparison. Provide two lists of URLs. The Shot Check Tool will take
screenshots of each URL and compare them in order. For example:

```
+--------------------------+  +--------------------------+
|       Site A URLs        |  |       Site B URLs        |
+--------------------------+  +--------------------------+
| https://site-a.com/path1 |  | https://site-b.com/path1 | <-- These two pages will be compared
| https://site-a.com/path2 |  | https://site-b.com/path2 | <-- These two pages will be compared
| https://site-a.com/path3 |  | https://site-b.com/path3 | <-- These two pages will be compared
+--------------------------+  +--------------------------+

                 +---------------------+
                 | Capture and Compare |
                 +---------------------+
```

2) Before and After. Select an environment and site and provide one list of
paths. The Shot Check Tool will capture screenshots and then pause. Deploy a
new build of the site or make other changes, then come back to the tool and
resume. The Shot Check Tool will capture screenshots again and compare the
before and after screenshots. For example:

```

       Site: [Site A]  (Site A Base URL on QA is https://qa.site-a.com/)
Environment: [QA]

+--------+
| Paths  |
+--------+
| /path1 | <-- This page will be combined with the base URL and captured twice
| /path2 | <-- This page will be combined with the base URL and captured twice
| /path3 | <-- This page will be combined with the base URL and captured twice
+--------+

+---------+                          +---------------------------+
| Capture | -> [Deploy new build] -> | Capture Again and Compare |
+---------+                          +---------------------------+
```

3) Environment to Environment. Select a site and two environments and provide one
list of paths. The Shot Check Tool will capture screenshots for each path on
both environments and compare. For example:

```
        Site: [Site A]   (Site A Base URL on QA is https://qa.site-a.com/)
Environments: [QA] [UAT] (Site A Base URL on UAT is https://uat.site-a.com/)

+--------+
| Paths  |
+--------+
| /path1 | <-- This page will be combined with each base URL and captured on QA and UAT
| /path2 | <-- This page will be combined with each base URL and captured on QA and UAT
| /path3 | <-- This page will be combined with each base URL and captured on QA and UAT
+--------+

```

4) Verify. Select a production environment and a site. Provide one list of
paths. During a blue/green deployment when both production instances are
running, the Shot Check Tool will capture screenshots for each path on the
primary URL and the verify URL and compare.

**Note**: It is not necessary to provide a verify URL for each site, as the
base URL will be sent as the X-Forwarded-Host header in the request.

For example:

```
       Site: [Site A] (Site A Base URL on Prod is https://www.site-a.com/)
Environment: [Prod]   (Prod Verify URL is https://verify.site-a.com/)

+--------+
| Paths  |
+--------+
| /path1 | <-- This page will be captured on Prod and Verify, using the Prod Host header
| /path2 | <-- This page will be captured on Prod and Verify, using the Prod Host header
| /path3 | <-- This page will be captured on Prod and Verify, using the Prod Host header
+--------+

+---------+
| Capture |
+---------+
```

Behind the scenes, [Puppeteer](https://github.com/puppeteer/puppeteer) is used
to capture screenshots, and [PixelMatch](https://github.com/mapbox/pixelmatch)
is used to compare.
