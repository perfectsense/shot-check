# Shot Check

Shot Check is an automated QA tool. Its purpose is to capture screenshots of a
website before and after a code change, detect differences in the before and
after screenshots, and report the differences to the tester.

* [Installation](#installation)
* [Usage](#usage)
* [Advanced Usage](#advanced-usage)
* [Frequently Asked Questions](#frequently-asked-questions)
* [Contributing](#contributing)
* [Roadmap](#roadmap)
* [License](#license)

# Installation

Download the installer for your platform (Mac OS or Windows) from the
[latest release](https://github.com/perfectsense/shot-check/releases/latest) page.
Shot Check will automatically check for updates and install the latest stable
release every time it is launched.

# Usage

There are several types of automatic screenshot comparisons Shot Check can do depending on your scenario and use case.

* [Manual Check](#manual-check)
* [Check Results Screen](#check-results-screen)
* [Setting up a Project](#setting-up-a-project)
* [Before and After](#before-and-after)
* [Environment to Environment](#environment-to-environment)
* [Blue/Green Verify](#bluegreen-verify)
* [Baseline Capture and Compare](#baseline-capture-and-compare)

## Manual Check

Provide two lists of URLs. Shot Check will take screenshots of each URL and compare them in order. For example:

![Side By Side Comparison](https://perfectsense.github.io/shot-check/img/side-by-side-sc-page-1-localhost.png)

## Check Results Screen

Checks can be reviewed in the Check Results Screen:

![Side By Side Comparison Result](https://perfectsense.github.io/shot-check/img/side-by-side-sc-page-1-localhost-results.png)

In this example you can see:

1. General information about the test run including the name, date, number of URL pairs, runtime duration, and size on disk.
2. The browser widths that were captured and compared. Click each one in succession to view the screenshots side by side.
3. The *left* URL and HTTP response status.
4. The *right* URL and HTTP response status.
5. The match percentage for the selected browser width.
6. The *left* captured screenshot in the selected browser width.
7. The *right* captured screenshot in the selected browser width.
8. The detected differences between the left screenshot and the right screenshot.

## Setting up a Project

To make Shot Check part of your normal testing process, it is important to
create a Project in Shot Check for each project you're working on to save your
commonly used configuration.

### Step 1: Create a New Project

On the home screen, click the "New Project" button on the bottom right. This
will prompt you to name your project and optionally indicate a filesystem path
where the config file will be saved.

**Tip**: Create this file in your project directory and check it in to version
control so your entire team can share!

![Create a Project](https://perfectsense.github.io/shot-check/img/create-project.png)

### Step 2: Create a Site

A Site is a collection of content represented by paths that are present on one
or more Environments. A Site does not have a base URL - that is provided by the
Environment.

![Create a Site](https://perfectsense.github.io/shot-check/img/create-site.png)

### Step 3: Create an Environment

![Create an Environment](https://perfectsense.github.io/shot-check/img/create-environment.png)

An Environment is a specific instance of your project. Usually, projects will
have one or more lower **test** environments and one **production** environment.
If you're a developer, you may also have a local **development** environment, as
well.

An Environment has a base URL that, when combined with a Site's collection of paths,
produces a collection of URLs. This collection of URLs will be used to run automated checks.

**Note**: An example project is created for you when you start Shot Check for the first
time. Use it as an example when creating your own projects.

## Before and After

Before and After is automatically enabled for every site and environment that
has a URL.

Select an environment and site and provide one list of paths. Shot Check
will capture screenshots and then pause. Deploy a new build of the site or
make other changes, then come back to the tool and resume. Shot Check
will capture screenshots again and compare the before and after screenshots.

![Before and After](https://perfectsense.github.io/shot-check/img/before-and-after.png)

When the initial capture is complete, the **Continue** screen is loaded for
you. Click the "Continue Check" button after your changes have been deployed to
capture the "after" screenshots and compare.

![Before and After Screen 2](https://perfectsense.github.io/shot-check/img/before-and-after-2.png)

## Environment to Environment

If you have a site with the exact same content published on more than one
environment, you can enter URLs for the site on both environments to enable the
**Environment to Environment** check type.

Select a site and two environments. The list of paths will be generated for
each environment, and Shot Check will capture screenshots for each path on
each environment and compare.

![Environment to Environment](https://perfectsense.github.io/shot-check/img/environment-to-environment.png)

## Blue/Green Verify

If your production environment is deployed using a [Blue-Green deployment
model](https://en.wikipedia.org/wiki/Blue-green_deployment), you can enter the
secondary URL prefix (sometimes known as the "verify url") in the production
environment settings to enable the **Blue/Green Verify** check type.

Select a production environment and a site. Provide one list of paths. During a
blue/green deployment when both production instances are running, Shot Check
will capture screenshots for each path on the primary URL and the verify URL
and compare.

**Note**: It is not necessary to provide a verify URL for each site, as the
base URL will be sent as the X-Forwarded-Host header in the request.

![Blue/Green Verify](https://perfectsense.github.io/shot-check/img/blue-green-verify.png)

## Baseline Capture and Compare

Similar to Before and After, capture a set of screenshots to establish a
baseline, then capture again and again using the same site on the same
environment or a different environment.

![Baseline Capture](https://perfectsense.github.io/shot-check/img/baseline-capture.png)

This comparison can be run against the same environment or a different environment.

![Baseline Compare](https://perfectsense.github.io/shot-check/img/baseline-compare.png)

## Preferences

The Preferences screen can be reached by clicking the gear icon in the upper right corner.

![Preferences](https://perfectsense.github.io/shot-check/img/preferences.png)

Here, you can set desired browser widths, auto-scroll speed, override the
Chrome executable path, and other global settings.

# Advanced Usage

## Ignore CSS Selectors

If a certain element of a site (such as an ad) is very dynamic, it will cause
false negatives in your comparisons. Use an Ignore CSS Selector to simply
remove those elements from the DOM before the screenshot is captured.

## Click CSS Selectors

Some sites present dialogs that must be clicked to accept cookies or decline to
subscribe to newsletters, etc. Use a Click CSS Selector to click these elements
on page load to dismiss the dialog before the screenshot is captured. **Note**:
If this click causes the browser to navigate to another page, the check will
fail with an error.

## Execute JavaScript on Page Load or After Auto-Scroll

If ignore and click do not cover your requirements, execute any custom
JavaScript you want after the page is loaded or after auto-scroll has been
completed. The method `shotCheckSleep(milliseconds)` is available in the page
environment for your convenience. Use this if a site uses an animation or
loading screen that cannot otherwise be skipped.

## Automatic Site Paths

If it is more convenient for you and your team to maintain a list of URLs that
should be part of regression tests on the site rather than a shared
configuration file, provide that path as part of the Site configuration. It
should be a path relative to the environment's base URL that emits a plain-text
list of URLs. For example: https://perfectsense.github.io/shot-check/example/production/spot-check-urls.txt

[Brightspot](https://www.brightspot.com/) has an optional module called "Spot
Check" that provides an automated method of analyzing template usage and
collecting a subset of site content that is structurally representative of all
content on the site. This representative subset can help drive regression
testing, as it ensures every unique template placement can be tested.

# Frequently Asked Questions

### Do I need to install anything on my web server to make this work?

No. Shot Check is a standalone [Electron](https://www.electronjs.org/)
application that can test any site that can be rendered in a modern web
browser.

### What's Auto-scroll?

In order to fully load all assets on a page before taking a screenshot, Shot
Check slowly scrolls to the bottom of each page in each breakpoint before
taking the full-page screenshot. If you know the assets are already loaded on a
given breakpoint and wish to speed up the capture process, you can select
"Turbo Auto-scroll" next to that breakpoint on the Preferences screen.

### Does this work in Firefox?

Not yet. [Puppeteer](https://pptr.dev/), the underlying browser automation
library used to capture screenshots, does have experimental support for
Firefox, so it is possible to add this in a future version.

### Is it safe to save the HTTP Basic Authentication username and password?

The basic auth username/password is saved in a separate file on your device,
not in the main configuration file. This is to ensure the Custom Configuration
File can be checked in to version control *without* also checking in the http
basic auth username and password to version control.

# Contributing

Pull requests are welcome. For major changes, please open an issue first to
discuss what you would like to change.

# Roadmap

* Support for authenticated page requests (paywall) via cookies
* Improve report view
* Report export
* Firefox support

# License

[Apache License 2.0](https://github.com/perfectsense/shot-check/blob/main/LICENSE)
