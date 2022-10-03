---
title: "Export database to use in integration tests."
date: "2022-10-04T00:00:00.000Z"
template: "post"
draft: false
slug: "shortcuts-in-visual-studio"
category: "Devops"
topics:
  - "Azure"
  - "C#"
  - ".Net"
  - "Pipelines"
  - "SQL Server"
description: "Use an exported database in integration tests by publishing a database backup, find and import the database in LocalDb in a Azure Pipelines."
socialImage: "/media/keyboard-shortcut.jpg"
---

The goal of this post is to show how to use a database export from a database project and use it in API integration tests.

## Motivation to use LocalDb

For the integration tests of the API I wanted to have a connection to a database to test the full API flow from the http call to the actual queries and commands. An in-memory database is not sufficient as this database provider has blocking limitions, such as:

* No awareness of relations between entities.
* No support for stored procedures.

[SQL Server Express LocalDb](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb?view=sql-server-2017) does not have these limitations, as it relies also on the SQL Server Database Engine. It has some other limitations, but none relevant for my use case.

A final advantage is that is easily accessible in Devops:

```yaml
- task: PowerShell@2
  displayName: Use LocalDb
  inputs:
    targetType: inline
    script: sqllocaldb start mydb
```

## Get the database

In order to get a representative database, I export a database after applying the entity migrations. In the current design the database and the API are seperated services.

```yaml
- task: SqlAzureDacpacDeployment@1
  inputs:
    azureSubscription: ${{ parameters.servicePrincipal }}
    serverName: ${{ parameters.sqlServerName }}
    databaseName: ${{ parameters.databaseName }}
    sqlUsername: ${{ parameters.sqlUsername }}
    sqlPassword: ${{ parameters.sqlPassword }}
    deployType: DacpacTask
    DeploymentAction: Export
    IpDetectionMethod: AutoDetect

- task: CopyFiles@2
  displayName: Copy bacpac file ArtifactStagingDirectory
  inputs:
    sourceFolder: $(build.sourcesDirectory)
    contents: "**/*.bacpac"
    targetFolder: $(build.artifactStagingDirectory)
    flattenFolders: true

- task: PublishBuildArtifacts@1
  displayName: Publish database backup
  inputs:
    artifactName: mydb
```

The database can be used in the API pipeline.

## Find and import database asset

To find the database asset was not that straightforward, as the build only completes after executing migrations in production. The integration tests need to run before, e.g. when API a new feature has an open pull request.

![release-pipeline.jpg](/media/release-pipeline.jpg)

The build id we are interested in is the one that has completed the test stage last.
We cannot use the [latest build](https://learn.microsoft.com/en-us/rest/api/azure/devops/build/latest/get?view=azure-devops-rest-6.0) as it only returns the latest completed build pipelines.

Below you find the script to retrieve the latest build which completed a specific stage.

```yaml
- task: PowerShell@2
  displayName: Set BuildId of latest ${{ parameters.solutionName }} database
  inputs:
    targetType: inline
    pwsh: true
    script: |
      # Get latest build sorted by time:
      $Url="$(System.TeamFoundationCollectionUri)/$(System.TeamProject)/_apis/build/builds?definitions=${{parameters.databaseReleasePipelineId}}&api-version=6.1"
      $Result = Invoke-RestMethod -Uri $Url -Headers @{authorization = "Bearer $(System.AccessToken)"} -Method Get
      $Result.value = $Result.value | Sort-Object queueTime -Descending

      foreach ($Build in $Result.value)
      {
        # Find the timeline of the stage of each build:
        $Result = Invoke-RestMethod -Uri $Build._links.timeline.href -Headers @{authorization = "Bearer $(System.AccessToken)"} -Method Get

        # Get the stage that completed 'Test' and set $Build.id:
        $TestStage = $Result.records | where {$_.type -eq "Stage" -and $_.identifier -eq "Test"}
        if ($TestStage.result -eq "succeeded"){
          $BuildId = $Build.id
          Write-Host "##[command] Using BuildId: $($BuildId)."
          echo "##vso[task.setvariable variable=BuildId]$BuildId"
          break
        }
      }
      if (!$BuildId){
        Write-Host "##[error] No build found with a succeeded Test Stage."
      }
```

Once I know the build id, I can download the artifacts using the normal `DownloadPipelineArtifact` task with the specific build.id.

```yaml
  - task: DownloadPipelineArtifact@2
    displayName: Download latest database
    inputs:
      source: specific
      project: $(System.TeamProjectId)
      pipeline: ${{ parameters.databaseReleasePipelineId }}
      runVersion: specific
      buildId: $(BuildId)
      path: $(Pipeline.Workspace)
      allowPartiallySucceededBuilds: true
      checkDownloadedFiles: true
```

We use [MartinCostello's `sqlLocalDbApi`](https://github.com/martincostello/sqllocaldb) to configure the database, attach the backup and import the data. High-level it creates the database and import the database.

```C#
using MartinCostello.SqlLocalDb;
using Microsoft.SqlServer.Dac;

// Create database.
using var localDB = new SqlLocalDbApi();
sqlLocalDbApi.GetOrCreateInstance(instanceName);
sqlLocalDbApi.StartInstance(instanceName);
var instance = sqlLocalDbApi.GetInstanceInfo(instanceName);

// Import database.
var options = new DacImportOptions
{
    CommandTimeout = 120,
    ImportContributors = typeof(DbCreateDatabaseModifier).FullName,
    ImportContributorArguments = $"{DbCreateDatabaseModifier.MdfFilePathArg}={dataFilePath};{DbCreateDatabaseModifier.LdfFilePathArg}={logFilePath}",
};
var package = BacPackage.Load(databasePath);
var service = new DacServices(connectionString);
service.ImportBacpac(package, databaseName, options);
```

In the integration test `appsettings.json`, we need to set the  connection string to the new database.

```json
{
  "ConnectionStrings": {
    "DbContext": "Data Source=(localdb)\\mydb;Initial Catalog=mydb;Integrated Security=SSPI;Application Name=mydb"
  }
}
```

The database is hosted in the pipeline agent itself. Now you are all set up to run your integration tests using a test database.
