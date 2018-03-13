---
layout: post
title: "Poor man's NuGet feed"
date: 2018-03-12 23:00:00 +0100
categories: [.NET Core, Nuget]
image: nuget5.png
---

Lately I have been writing .NET Core APIs on Windows and testing them in Ubuntu because one of the dependencies fails to work on Windows. These APIs use a library for some shared functionality and I had to make them available when I am working on the other machine. There are no free NuGet feeds available that will keep your packages private. I decided to use a Git repository to share the feed since there are a few free Git hosting services.

![Project folders][1]

I created a folder named nuget-feed along with my other project folders and initialized it as a Git repo. To make sure that the projects see this folder as a package source, we need to create a NuGet.config in the same folder that contains the solution file for every project. Be careful with the casing for the filename because if it's not exactly the same, it will be ignored.

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" protocolVersion="3" />
    <add key="trail" value="../nuget-feed/" />
  </packageSources>
</configuration>
```

We just need to do a git pull when  there is a new package and this is all we need to do to build projects that are using packages from our private feed.

We still need to create a package for every new version of our library and push it to the feed. I created a small script to do this:

```bash
# first folder contains the csproj you want to package
# second folder is the relative path to your nuget feed folder from the library folder
dotnet pack -c Release ./src/Trail.Common -o ./../../../nuget-feed

# switch to feed folder
cd ../nuget-feed

# add new package
git add -A

# get the file name
export NewFile=`git status --porcelain | awk '{print $2}'`

# commit & push
git commit -m "Added $NewFile"
git push
```

This script requires .NET Core CLI and some Unix tools to be in the path. Fortunately, [Git for Windows installation][2] takes care of that for us so it will work on Windows too. Modify the paths as you like and save it as pack.sh in your library repository. You can pack and push your package in a single step by running this script.

Now you have a private NuGet feed with zero costs.

[1]: /assets/img/trail.png
[2]: https://epsil.github.io/blog/2016/04/20/
