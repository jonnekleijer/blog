---
title: "Create a scalable timeseries application with Azure Data Explorer [2/x]"
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

Last blog we just used some sample data on the demo cluster of ADX themselves. In this blog we will spin up our own cluster and ingest data. Data ingestion can be done via batching or streaming. 

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

For the timeseries application, I choose to use Event Hub to ingest data, [see docs](https://docs.microsoft.com/en-us/azure/data-explorer/ingest-data-event-hub). For this timeseries app it has the preffered queuing mechanism with durable storage and not just a distribution system (e.g. Event Grid). Event Hub also maintains order by its partions, which for time series data is essential, especially if you want to compute efficient aggregated views on the data coming in. 

1. Setup Event Hub
Here we just followed the official documentation:

1.1. Create Event Hub
Create an Event Hub namespace and Event Hub.

1.2. Create resources in ADX

When creating the database you need to choose the:
* Retention time: Timespan that you are able to query the data. 1 year is the default and unlimited is an option.
* Cache period: Timespan the data is in the hot store (=SSD). This increases performance, but also uses relatively expensive storage. 31 days is the default and unlimited is an option.

You can create these clusters and database from code using the SDK. I choose to create it using the kusto query language. 

```Kusto
// Create table
.create table TimeSerieValues (TimeStamp: datetime, Value: double)

// Map incoming json data to the data types of the TimeSerieValues table
.create table TimeSerieValues ingestion json mapping 'TimeSerieValuesMapping' '[{"column":"TimeStamp", "Properties": {"Path": "$.timeStamp"}},{"column":"Value", "Properties": {"Path":"$.value"}}]'
  
1.3. Link Event Hub to ADX

1.4. Store data from C# client

.Net SDK
Steps:
1. Install package with the client that adx will consume (i.e. Event Hub sdk)
* Move Adx query provider to `.Clients` and register via DI
2. Send data using Event Hub 
3. Optionally create table and ingestion mapping

.ingest into table RawTimeSerieValues ('https://waterinfo.rws.nl/api/chart?mapType=waterhoogte&locationCode=Spooldersluis-binnen(SPBI)&values=-672,0') with '{"format":"multijson", "ingestionMappingReference":"RawTimeSerieValuesRwsMapping"}'

## Summary 
The code is available on [github](https://github.com/jonnekleijer/TimeSeriesApp). 

Here we showed an example on how to link Azure Data Explorer to a C# client and build your own custom logic on top of ADX. Sending queries using the C# client library only supports using strings and there is not an object model to build up your queries, which makes it a bit less developer friendly.


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
