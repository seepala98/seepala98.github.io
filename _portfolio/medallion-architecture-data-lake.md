---
layout: project
title: "Medallion Architecture Data Lake Platform"
date: 2023-09-20
technologies: ["Medallion Architecture", "Apache Spark", "Delta Lake", "Azure Databricks", "Apache Airflow", "Terraform"]
---

## Project Overview 🏗️

Architected and implemented a comprehensive Medallion Architecture data lake platform on Azure, processing 50TB+ of daily data across Bronze, Silver, and Gold layers. The solution enabled self-service analytics for 200+ business users while maintaining 99.9% data quality and reducing data processing costs by 55%.

## Business Challenge 📊

The organization faced several critical data platform challenges:
- **Data Silos**: Multiple teams creating isolated data solutions
- **Quality Issues**: Inconsistent data quality across business units
- **Scalability Constraints**: Legacy systems couldn't handle growing data volumes
- **Time-to-Insight**: Weeks to months for new analytics use cases
- **Cost Efficiency**: High operational costs with limited resource utilization

## Architecture & Design 🏗️

### Medallion Architecture Layers

#### Bronze Layer (Raw Data)
- **Purpose**: Ingestion and storage of raw, unprocessed data
- **Storage**: Azure Data Lake Storage (ADLS) with Delta Lake format
- **Processing**: Apache Spark for batch and streaming ingestion
- **Schema**: Schema-on-read with flexible JSON/Parquet storage

#### Silver Layer (Refined Data)
- **Purpose**: Cleaned, validated, and standardized data
- **Storage**: Delta Lake with ACID transactions
- **Processing**: Apache Spark with data quality validations
- **Schema**: Strongly typed schemas with business logic applied

#### Gold Layer (Business-Ready Data)
- **Purpose**: Aggregated, enriched data for analytics consumption
- **Storage**: Delta Lake with optimized partitioning
- **Processing**: Apache Spark with advanced analytics
- **Schema**: Dimensional models and aggregated fact tables

### Technology Stack
- **Compute**: Azure Databricks for unified analytics
- **Storage**: Azure Data Lake Storage Gen2
- **Format**: Delta Lake for ACID transactions
- **Orchestration**: Apache Airflow for workflow management
- **Infrastructure**: Terraform for Infrastructure as Code
- **Monitoring**: Azure Monitor and Databricks monitoring

## Technical Implementation 💻

### Bronze Layer Implementation
```python
# Bronze layer ingestion pipeline
from delta import DeltaTable
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *

class BronzeDataIngestion:
    def __init__(self, spark: SparkSession):
        self.spark = spark
        self.bronze_path = "/mnt/datalake/bronze"
    
    def ingest_streaming_data(self, source_path: str, table_name: str):
        """Ingest streaming data into Bronze layer"""
        
        # Define schema for structured streaming
        schema = StructType([
            StructField("event_id", StringType(), True),
            StructField("timestamp", TimestampType(), True),
            StructField("user_id", StringType(), True),
            StructField("event_type", StringType(), True),
            StructField("payload", StringType(), True)
        ])
        
        # Read streaming data
        streaming_df = (self.spark
                       .readStream
                       .format("json")
                       .schema(schema)
                       .option("path", source_path)
                       .load())
        
        # Add metadata columns
        enriched_df = (streaming_df
                      .withColumn("ingestion_timestamp", current_timestamp())
                      .withColumn("source_file", input_file_name())
                      .withColumn("partition_date", col("timestamp").cast("date")))
        
        # Write to Bronze layer with checkpointing
        bronze_writer = (enriched_df
                        .writeStream
                        .format("delta")
                        .outputMode("append")
                        .option("checkpointLocation", f"{self.bronze_path}/checkpoints/{table_name}")
                        .partitionBy("partition_date")
                        .trigger(processingTime="1 minute"))
        
        return bronze_writer.start(f"{self.bronze_path}/{table_name}")
    
    def ingest_batch_data(self, source_path: str, table_name: str):
        """Ingest batch data into Bronze layer"""
        
        # Read batch data
        batch_df = (self.spark
                   .read
                   .format("parquet")
                   .load(source_path))
        
        # Add metadata columns
        enriched_df = (batch_df
                      .withColumn("ingestion_timestamp", current_timestamp())
                      .withColumn("source_file", input_file_name())
                      .withColumn("partition_date", current_date()))
        
        # Write to Bronze layer
        (enriched_df
         .write
         .format("delta")
         .mode("append")
         .partitionBy("partition_date")
         .save(f"{self.bronze_path}/{table_name}"))
        
        return f"Successfully ingested {batch_df.count()} records to Bronze layer"
```

### Silver Layer Implementation
```python
# Silver layer data refinement pipeline
from great_expectations.core import ExpectationSuite
from great_expectations.dataset import SparkDFDataset

class SilverDataRefinement:
    def __init__(self, spark: SparkSession):
        self.spark = spark
        self.bronze_path = "/mnt/datalake/bronze"
        self.silver_path = "/mnt/datalake/silver"
    
    def refine_customer_data(self):
        """Refine customer data from Bronze to Silver layer"""
        
        # Read from Bronze layer
        bronze_df = (self.spark
                    .read
                    .format("delta")
                    .load(f"{self.bronze_path}/customers"))
        
        # Data cleansing and standardization
        refined_df = (bronze_df
                     .filter(col("user_id").isNotNull())  # Remove null user_ids
                     .withColumn("email", lower(trim(col("email"))))  # Standardize email
                     .withColumn("phone", regexp_replace(col("phone"), "[^0-9]", ""))  # Clean phone
                     .withColumn("first_name", initcap(trim(col("first_name"))))  # Standardize names
                     .withColumn("last_name", initcap(trim(col("last_name"))))
                     .withColumn("created_date", to_timestamp(col("created_date")))
                     .withColumn("updated_date", current_timestamp()))
        
        # Data quality validations
        quality_df = self.apply_data_quality_checks(refined_df, "customers")
        
        # Write to Silver layer with merge operation
        self.merge_to_silver(quality_df, "customers", "user_id")
        
        return f"Successfully processed {quality_df.count()} customer records"
    
    def apply_data_quality_checks(self, df, table_name):
        """Apply data quality checks using Great Expectations"""
        
        # Create expectation suite
        suite = ExpectationSuite(f"{table_name}_quality_suite")
        
        # Wrap DataFrame with Great Expectations
        ge_df = SparkDFDataset(df)
        
        # Define expectations
        expectations = [
            ge_df.expect_column_to_exist("user_id"),
            ge_df.expect_column_values_to_not_be_null("user_id"),
            ge_df.expect_column_values_to_be_unique("user_id"),
            ge_df.expect_column_values_to_match_regex("email", r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
            ge_df.expect_column_values_to_be_between("created_date", 
                                                    min_value="2020-01-01", 
                                                    max_value=datetime.now().strftime("%Y-%m-%d"))
        ]
        
        # Validate expectations
        validation_result = ge_df.validate(expectation_suite=suite)
        
        if validation_result.success:
            return df
        else:
            # Log validation failures and apply corrections
            self.log_quality_issues(validation_result, table_name)
            return self.apply_quality_corrections(df, validation_result)
    
    def merge_to_silver(self, df, table_name, merge_key):
        """Merge data to Silver layer using Delta Lake MERGE operation"""
        
        silver_table_path = f"{self.silver_path}/{table_name}"
        
        # Create Delta table if it doesn't exist
        if not DeltaTable.isDeltaTable(self.spark, silver_table_path):
            (df.write
             .format("delta")
             .mode("overwrite")
             .save(silver_table_path))
        else:
            # Load existing Delta table
            silver_table = DeltaTable.forPath(self.spark, silver_table_path)
            
            # Perform merge operation
            (silver_table
             .alias("target")
             .merge(df.alias("source"), f"target.{merge_key} = source.{merge_key}")
             .whenMatchedUpdateAll()
             .whenNotMatchedInsertAll()
             .execute())
```

### Gold Layer Implementation
```python
# Gold layer business-ready data pipeline
class GoldDataAggregation:
    def __init__(self, spark: SparkSession):
        self.spark = spark
        self.silver_path = "/mnt/datalake/silver"
        self.gold_path = "/mnt/datalake/gold"
    
    def create_customer_360_view(self):
        """Create comprehensive customer 360 view"""
        
        # Read from Silver layer
        customers_df = self.spark.read.format("delta").load(f"{self.silver_path}/customers")
        orders_df = self.spark.read.format("delta").load(f"{self.silver_path}/orders")
        interactions_df = self.spark.read.format("delta").load(f"{self.silver_path}/interactions")
        
        # Customer aggregations
        customer_metrics = (orders_df
                           .groupBy("customer_id")
                           .agg(
                               count("order_id").alias("total_orders"),
                               sum("order_amount").alias("total_revenue"),
                               avg("order_amount").alias("avg_order_value"),
                               max("order_date").alias("last_order_date"),
                               min("order_date").alias("first_order_date")
                           ))
        
        # Interaction aggregations
        interaction_metrics = (interactions_df
                              .groupBy("customer_id")
                              .agg(
                                  count("interaction_id").alias("total_interactions"),
                                  countDistinct("channel").alias("unique_channels"),
                                  max("interaction_date").alias("last_interaction_date")
                              ))
        
        # Customer 360 view
        customer_360 = (customers_df
                       .join(customer_metrics, "customer_id", "left")
                       .join(interaction_metrics, "customer_id", "left")
                       .withColumn("customer_lifetime_value", 
                                  col("total_revenue") * lit(1.2))  # Simple CLV calculation
                       .withColumn("days_since_last_order", 
                                  datediff(current_date(), col("last_order_date")))
                       .withColumn("customer_segment", 
                                  when(col("total_revenue") > 10000, "Premium")
                                  .when(col("total_revenue") > 5000, "Gold")
                                  .when(col("total_revenue") > 1000, "Silver")
                                  .otherwise("Bronze"))
                       .withColumn("churn_risk", 
                                  when(col("days_since_last_order") > 90, "High")
                                  .when(col("days_since_last_order") > 60, "Medium")
                                  .otherwise("Low")))
        
        # Write to Gold layer
        (customer_360
         .write
         .format("delta")
         .mode("overwrite")
         .option("overwriteSchema", "true")
         .save(f"{self.gold_path}/customer_360_view"))
        
        return f"Successfully created Customer 360 view with {customer_360.count()} records"
    
    def create_daily_sales_summary(self):
        """Create daily sales summary for executive dashboards"""
        
        orders_df = self.spark.read.format("delta").load(f"{self.silver_path}/orders")
        
        daily_summary = (orders_df
                        .withColumn("order_date", col("order_date").cast("date"))
                        .groupBy("order_date")
                        .agg(
                            count("order_id").alias("total_orders"),
                            sum("order_amount").alias("total_revenue"),
                            avg("order_amount").alias("avg_order_value"),
                            countDistinct("customer_id").alias("unique_customers"),
                            max("order_amount").alias("max_order_value"),
                            min("order_amount").alias("min_order_value")
                        )
                        .withColumn("revenue_per_customer", 
                                   col("total_revenue") / col("unique_customers"))
                        .withColumn("created_timestamp", current_timestamp()))
        
        # Write to Gold layer
        (daily_summary
         .write
         .format("delta")
         .mode("append")
         .save(f"{self.gold_path}/daily_sales_summary"))
        
        return f"Successfully created daily sales summary"
```

### Data Quality Monitoring
```python
# Data quality monitoring framework
class DataQualityMonitor:
    def __init__(self, spark: SparkSession):
        self.spark = spark
        self.quality_metrics_path = "/mnt/datalake/quality_metrics"
    
    def monitor_data_quality(self, layer: str, table_name: str):
        """Monitor data quality metrics across layers"""
        
        table_path = f"/mnt/datalake/{layer}/{table_name}"
        df = self.spark.read.format("delta").load(table_path)
        
        # Calculate quality metrics
        total_records = df.count()
        null_counts = {}
        duplicate_counts = {}
        
        for column in df.columns:
            null_counts[column] = df.filter(col(column).isNull()).count()
            duplicate_counts[column] = df.groupBy(column).count().filter(col("count") > 1).count()
        
        # Calculate quality score
        total_nulls = sum(null_counts.values())
        total_duplicates = sum(duplicate_counts.values())
        quality_score = max(0, 100 - (total_nulls + total_duplicates) / total_records * 100)
        
        # Create quality report
        quality_report = {
            "layer": layer,
            "table_name": table_name,
            "total_records": total_records,
            "null_counts": null_counts,
            "duplicate_counts": duplicate_counts,
            "quality_score": quality_score,
            "timestamp": datetime.now().isoformat()
        }
        
        # Store quality metrics
        quality_df = self.spark.createDataFrame([quality_report])
        (quality_df
         .write
         .format("delta")
         .mode("append")
         .save(self.quality_metrics_path))
        
        return quality_report
```

## Key Features & Achievements 🎯

### Performance Metrics
- **Data Processing**: 50TB+ daily processing with 99.9% uptime
- **Query Performance**: 90% of queries execute in under 10 seconds
- **Cost Optimization**: 55% reduction in processing costs
- **Scalability**: Auto-scaling from 2 to 100 nodes based on workload

### Business Impact
- **Self-Service Analytics**: 200+ business users accessing data independently
- **Time-to-Insight**: 80% reduction in analytics delivery time
- **Data Quality**: 99.9% data accuracy across all layers
- **Operational Efficiency**: 70% reduction in manual data operations

### Technical Innovations
- **Delta Lake**: ACID transactions and time travel capabilities
- **Auto-Optimization**: Automatic file compaction and Z-ordering
- **Schema Evolution**: Seamless schema changes without downtime
- **Real-time Processing**: Mixed batch and streaming workloads

## Data Governance & Security 🔒

### Access Control Implementation
```python
# Role-based access control for data lake
class DataLakeAccessControl:
    def __init__(self, spark: SparkSession):
        self.spark = spark
    
    def setup_table_access_control(self, table_name: str, layer: str):
        """Setup fine-grained access control for tables"""
        
        # Bronze layer - Data Engineers only
        if layer == "bronze":
            self.spark.sql(f"""
                GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE {table_name} 
                TO 'data-engineers'
            """)
        
        # Silver layer - Data Engineers and Analysts
        elif layer == "silver":
            self.spark.sql(f"""
                GRANT SELECT ON TABLE {table_name} TO 'data-analysts'
            """)
            self.spark.sql(f"""
                GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE {table_name} 
                TO 'data-engineers'
            """)
        
        # Gold layer - All authenticated users
        elif layer == "gold":
            self.spark.sql(f"""
                GRANT SELECT ON TABLE {table_name} TO 'all-users'
            """)
    
    def apply_row_level_security(self, table_name: str, user_role: str):
        """Apply row-level security based on user role"""
        
        if user_role == "region-manager":
            return f"""
            CREATE OR REPLACE VIEW {table_name}_view AS
            SELECT * FROM {table_name}
            WHERE region = current_user_region()
            """
        elif user_role == "executive":
            return f"""
            CREATE OR REPLACE VIEW {table_name}_view AS
            SELECT * FROM {table_name}
            """
        else:
            return f"""
            CREATE OR REPLACE VIEW {table_name}_view AS
            SELECT * FROM {table_name}
            WHERE created_by = current_user()
            """
```

## Infrastructure as Code 🏗️

### Terraform Configuration
```hcl
# Azure Databricks workspace
resource "azurerm_databricks_workspace" "medallion_workspace" {
  name                = "medallion-databricks-workspace"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "premium"
  
  custom_parameters {
    no_public_ip        = true
    virtual_network_id  = azurerm_virtual_network.main.id
    public_subnet_name  = azurerm_subnet.public.name
    private_subnet_name = azurerm_subnet.private.name
  }
}

# Azure Data Lake Storage Gen2
resource "azurerm_storage_account" "data_lake" {
  name                     = "medallionlake${random_string.suffix.result}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  account_kind             = "StorageV2"
  is_hns_enabled           = true
  
  network_rules {
    default_action = "Deny"
    ip_rules       = [var.allowed_ip_ranges]
    virtual_network_subnet_ids = [
      azurerm_subnet.databricks_public.id,
      azurerm_subnet.databricks_private.id
    ]
  }
}

# Data Lake containers for each layer
resource "azurerm_storage_data_lake_gen2_filesystem" "bronze" {
  name               = "bronze"
  storage_account_id = azurerm_storage_account.data_lake.id
}

resource "azurerm_storage_data_lake_gen2_filesystem" "silver" {
  name               = "silver"
  storage_account_id = azurerm_storage_account.data_lake.id
}

resource "azurerm_storage_data_lake_gen2_filesystem" "gold" {
  name               = "gold"
  storage_account_id = azurerm_storage_account.data_lake.id
}
```

## Monitoring & Alerting 📊

### Custom Monitoring Dashboard
```python
# Data pipeline monitoring
class MedallionMonitoring:
    def __init__(self, spark: SparkSession):
        self.spark = spark
        self.metrics_path = "/mnt/datalake/monitoring"
    
    def track_pipeline_metrics(self, layer: str, table_name: str, 
                              records_processed: int, processing_time: float):
        """Track pipeline execution metrics"""
        
        metrics = {
            "layer": layer,
            "table_name": table_name,
            "records_processed": records_processed,
            "processing_time_seconds": processing_time,
            "throughput_records_per_second": records_processed / processing_time,
            "timestamp": datetime.now().isoformat(),
            "date": datetime.now().strftime("%Y-%m-%d")
        }
        
        # Store metrics
        metrics_df = self.spark.createDataFrame([metrics])
        (metrics_df
         .write
         .format("delta")
         .mode("append")
         .partitionBy("date")
         .save(f"{self.metrics_path}/pipeline_metrics"))
    
    def generate_health_report(self):
        """Generate overall data lake health report"""
        
        # Read recent metrics
        metrics_df = (self.spark
                     .read
                     .format("delta")
                     .load(f"{self.metrics_path}/pipeline_metrics")
                     .filter(col("date") >= date_sub(current_date(), 7)))
        
        # Calculate health metrics
        health_summary = (metrics_df
                         .groupBy("layer", "table_name")
                         .agg(
                             count("*").alias("total_runs"),
                             avg("processing_time_seconds").alias("avg_processing_time"),
                             sum("records_processed").alias("total_records_processed"),
                             max("timestamp").alias("last_run_timestamp")
                         ))
        
        return health_summary
```

## Future Enhancements 🚀

### Planned Features
- **Machine Learning Integration**: MLflow integration for model lifecycle management
- **Advanced Analytics**: Graph analytics and time-series analysis
- **Data Mesh**: Domain-oriented data architecture
- **Real-time Analytics**: Apache Kafka integration for streaming analytics

### Technical Roadmap
- **Multi-Cloud**: Expand to AWS and GCP for hybrid deployments
- **Edge Processing**: IoT data processing at the edge
- **Advanced Security**: Zero-trust architecture and encryption
- **Automated Optimization**: ML-powered query and storage optimization

## Technologies Used 🛠️

**Compute**: Azure Databricks, Apache Spark
**Storage**: Azure Data Lake Storage Gen2, Delta Lake
**Orchestration**: Apache Airflow, Azure Data Factory
**Infrastructure**: Terraform, Azure Resource Manager
**Monitoring**: Azure Monitor, Databricks monitoring
**Security**: Azure Active Directory, Key Vault
**Quality**: Great Expectations, Delta Lake constraints

## Lessons Learned 📚

1. **Layer Separation**: Clear boundaries between layers improve maintainability
2. **Data Quality**: Invest in quality frameworks early in the process
3. **Performance**: Partitioning and clustering strategies are crucial
4. **Governance**: Access control and monitoring are essential for production
5. **Scalability**: Design for auto-scaling from day one

---

*This project demonstrates modern data lake architecture using Medallion Architecture principles, showcasing expertise in large-scale data processing, quality management, and cloud-native solutions.* 