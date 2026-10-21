import { DataSourceTypes } from 'jimu-core';
import type { KnowledgeGraphSublayerDataSource } from 'jimu-core/lib/data-sources/interfaces/knowledge-graph-sublayer-data-source-interface';
import { AbstractArcGISQueriableDataSource } from 'jimu-data-source/base-classes/abstract-arcgis-queriable-data-source';
export declare class KnowledgeGraphSublayerDataSourceImpl extends AbstractArcGISQueriableDataSource implements KnowledgeGraphSublayerDataSource {
    type: DataSourceTypes.KnowledgeGraphSublayer;
    constructor(options: any);
    protected jsAPILayerQueryObjectIds(query: __esri.Query | __esri.QueryProperties, layer?: __esri.KnowledgeGraphSublayer | __esri.FeatureLayer): Promise<Array<number | string>>;
    protected jsAPILayerQueryFeatures(query: __esri.Query | __esri.QueryProperties, layer?: __esri.KnowledgeGraphSublayer | __esri.FeatureLayer): Promise<__esri.FeatureSet>;
    protected jsAPILayerQueryFeatureCount(query: __esri.Query | __esri.QueryProperties, layer?: __esri.KnowledgeGraphSublayer | __esri.FeatureLayer): Promise<number>;
    protected jsAPILayerQueryExtent(query: __esri.Query | __esri.QueryProperties, layer?: __esri.KnowledgeGraphSublayer | __esri.FeatureLayer): Promise<{
        count: number;
        extent: __esri.Extent;
    }>;
    ready(): Promise<void>;
}
