---
layout: post
title: "Integrating Jenkins with Octopus Deploy"
date: 2014-04-20 17:20:56 +0300
categories: [Jenkins, Octopus Deploy, MSBuild]
---

Jenkins can easily produce deployable NuGet packages for Octopus Deploy. You should start by adding [OctoPack][1] package to the project you want to deploy.

    Install-Package OctoPack

I'm getting MSBuild to generate the assembly versions so I don't have to manually increment them. OctoPack will use the same version for creating the deployable package(unless you use a nuspec file or specify it with a command line parameter). We will edit AssemblyInfo.cs to make this work.

```csharp
[assembly: AssemblyVersion("1.0.*")]
//[assembly: AssemblyFileVersion("1.0.0.0")]
```

We commented out AssemblyFileVersionAttribute becase MSBuild can't generate it for us. This way it will use the same version for the file version too.

Next I'll create a Jenkins project. Setup your source control and [MSBuild plugin][2]. I will use [Git plugin][3] for this demo. Source code is on a [public repo on GitHub][4] so you can use the same parameters if you want to make a test deploy. It's an ASP.NET MVC 4 project so make sure that Visual Studio 2012 is installed or the [necessary files][5] are copied to the server.

Once you configured the plugins, create the project with the following parameters:

![SimpleMvcSitemap.Sample][6]

The parameters you may want to copy(don't forget to clone octopus branch):

    https://github.com/uhaciogullari/SimpleMvcSitemap.git
    SimpleMvcSitemap.Sample\SimpleMvcSitemap.Sample.csproj
    /p:Configuration=Release;RunOctoPack=true

Try to build the project. It should fail with the OctoPack error below, otherwise there's a configuration error with your plugins or the project.

> OctoPack cannot be run because NuGet packages were restored prior to the build running, and the targets file was unavailable when the build started. Please build the project again to include these packages in the build. You may also need to make sure that your build server does not delete packages prior to each build. For more information, see http://go.microsoft.com/fwlink/?LinkID=317568.

Build the project again and it should succeed. You can find the package OctoPack created in project's obj\octopacked folder. If you can verify that it's there, go on and [install Octopus Deploy][7]. Once it's up, create an API Key from [http://your-octopus-server/app#/users/me](http://your-octopus-server/app#/users/me). We will use it to publish the packages to the built-in NuGet repository. Change the MSBuild parameters in your Jenkins project to this (replace the API key and the Octopus URL):

    /p:Configuration=Release;RunOctoPack=true;OctoPackPublishApiKey=YOURAPIKEY;OctoPackPublishPackageToHttp=http://your-octopus-server/nuget/packages
    
After a successful build you should see that the built-in NuGet repository has the package. You can check it from [http://your-octopus-server/app#/configuration/feeds/feeds-builtin/test](http://your-octopus-server/app#/configuration/feeds/feeds-builtin/test).

![Package test][8]

There's one last thing we have to fix. When you only change a view in an MVC project, MSBuild won't generate a new version number thinking that the assembly has not changed at all. Although I have not tested it, it will be probably same for the content files. This wouldn't be a problem if Octopus Deploy would allow overwriting packages. In fact it silently drops the packages with the same version number. It is [planned to be fixed soon][9] but it still won't allow overwriting. We have to force MSBuild to create a new version number in each build. That can be done with rebuilding the project. Just update the MSBuild parameter like this:

    /t:Rebuild /p:Configuration=Release;RunOctoPack=true;OctoPackPublishApiKey=YOURAPIKEY;OctoPackPublishPackageToHttp=http://your-octopus-server/nuget/packages

That's all, you can go on and [deploy the packages][10].


[1]: http://www.nuget.org/packages/OctoPack
[2]: https://wiki.jenkins-ci.org/display/JENKINS/MSBuild+Plugin
[3]: https://wiki.jenkins-ci.org/display/JENKINS/Git+Plugin
[4]: https://github.com/uhaciogullari/SimpleMvcSitemap
[5]: http://stackoverflow.com/a/19385710/205859
[6]: https://i.imgur.com/nIAcSQy.png
[7]: http://docs.octopusdeploy.com/display/OD/Installing+Octopus
[8]: https://i.imgur.com/lZJOJno.png
[9]: https://github.com/OctopusDeploy/Issues/issues/858
[10]: http://docs.octopusdeploy.com/display/OD/Deploying+packages
