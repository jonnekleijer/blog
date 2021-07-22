---
title: "Create a timeseries application with Azure Data Explorer [2/x]"
date: "2021-05-25T00:00:00.000Z"
template: "post"
draft: false
slug: "web-api-with-adx-2"
category: "Timeseries"
topics:
  - "Timeseries"
  - ".Net"
  - "Azure"
  - "C#"
  - "Azure Data Explorer"
description: "In this post we explore ingestion of timeseries data. Azure Data Explorer is a timeseries database, which can be used for IoT, logs or performance metrics. This is part of a series of blog posts. "
socialImage: "/media/keyboard-shortcut.jpg"
---

## Background
This article is a first introduction to [Azure Data Explorer](https://azure.microsoft.com/en-us/services/data-explorer/)(ADX) for ingesting timeseries data in a simple .NET application. Handling timeseries becomes more an more valuable. Both monitoring our own assets as developers, but also assets of our clients in the IoT realm. 

The code in this article is available on [github](https://github.com/jonnekleijer/TimeSeriesApp). 

Data ingestion can be done via batching or streaming. 

| Batching                                            | Streaming                 |
| --------------------------------------------------- | ------------------------- |
| Optimized for high throughput                       | Optimized for low latency |
| More performant                                     | Less performant           |
| Configure batching policy (time, #items, data size) | Small sets per table      |
| Column store                                        | Row store                 |



Options to upload data:
* Using kql
* Managed pipelines
  * [Event Grid](https://docs.microsoft.com/en-us/azure/data-explorer/ingest-data-event-grid) in combination with blob storage
  * [Event Hub](https://docs.microsoft.com/en-us/azure/data-explorer/ingest-data-event-hub)
  * [IoT Hub](https://docs.microsoft.com/en-us/azure/data-explorer/ingest-data-iot-hub)
  * [Azure Data Factory](https://docs.microsoft.com/en-us/azure/data-explorer/data-factory-integration)

For the timeseries application, I choose to use Event Hub, because it has more of queuing mechanism with durable storage and not just a distribution system, like Event Grid for example. To me, that a great entry point of the first in line when receiving data. Also Event Hub maintains order by its partions, which for time series data is essential, especially if you want to compute aggregated views on the data coming in. 

So, let's first create a kusto cluster to send our data to.
When creating the database you need to choose the:
* Retention time: Timespan that you are able to query the data. 1 year is the default and unlimited is an option.
* Cache period: Timespan the data is in the hot store (=SSD). This increases performance, but also uses storage. 31 days is the default and unlimited is an option.
You can create these clusters and database from code using the SDK. I choose to create it using the kusto query language.

```Kusto
// Create tables
.create table TimeSerieValues (Time: datetime, Value: double)

.create table RawTimeSerieValues (Values: dynamic)

// Create function to update values from raw
.create function TimeSerieValuesExpand() {
    RawTimeSerieValues
    | mv-expand values = Values.data
    | project
        Time = todatetime(values["timestamp"]),
        Value = todouble(values["value"])
}

.alter table TimeSerieValues policy update @'[{"Source": "RawTimeSerieValues", "Query": "TimeSerieValuesExpand()", "IsEnabled": "True"}]'

.create table RawTimeSerieValues ingestion json mapping 'RawTimeSerieValuesRwsMapping' '[{"column":"Values","Properties":{"path":"$.series.data"}}]'

// Ingest data
.ingest into table RawTimeSerieValues ('https://waterinfo.rws.nl/api/chart?mapType=waterhoogte&locationCode=Spooldersluis-binnen(SPBI)&values=-672,0') with '{"format":"multijson", "ingestionMappingReference":"RawTimeSerieValuesRwsMapping"}'

RawTimeSerieValues

```



.Net SDK
Steps:
1. Install package with the client that adx will consume (i.e. Event Hub sdk)
* Move Adx query provider to `.Clients` and register via DI
2. Send data using Event Hub 
3. Optionally create table and ingestion mapping

## Prerequisites:
* [dotnet cli](https://docs.microsoft.com/en-us/dotnet/core/tools/) to create new .NET projects
* [postman](https://www.postman.com/) to test the api calls
* [visual studio](https://visualstudio.microsoft.com/) or another IDE

## Setup

## Timeserie Controller


## Timeserie Service

## Timeserie Query

## Summary 
The code is available on [github](https://github.com/jonnekleijer/TimeSeriesApp). 

Here we showed an example on how to link Azure Data Explorer to a C# client and build your own custom logic on top of ADX. We've seen we don't require to precalculate aggregates, which makes this a flexible database for timeserie analysis. Sending queries using the C# client library only supports using strings and there is not an object model to build up your queries, which makes it a bit less developer friendly.


Some next steps might be:
* Explore More advanced KQL queries
* Ingest data
* Manage our own Azure Data Explorer resources (e.g # of clusters)
* Add a user interface to explore the timeseries

## References:
* [Homepage of Azure Data Explorer](https://azure.microsoft.com/en-us/services/data-explorer/)
* [Sample database](https://dataexplorer.azure.com/clusters/help/databases/Samples)
* [Client Library](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/api/netfx/about-kusto-data)
* [Introduction to ADX on Pluralsight](https://app.pluralsight.com/library/courses/microsoft-azure-data-explorer-starting/table-of-contents)
