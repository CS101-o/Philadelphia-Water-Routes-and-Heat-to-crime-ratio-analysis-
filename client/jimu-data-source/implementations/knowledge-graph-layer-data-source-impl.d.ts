import { DataSourceTypes } from 'jimu-core';
import type { KnowledgeGraphLayerDataSource } from 'jimu-core/lib/data-sources/interfaces/knowledge-graph-layer-data-source-interface';
import { AbstractLayerFolderDataSource, type LayerFolderChildDataSourceConstructorOptions } from 'jimu-data-source/base-classes/abstract-layer-folder-data-source';
export declare class KnowledgeGraphLayerDataSourceImpl extends AbstractLayerFolderDataSource implements KnowledgeGraphLayerDataSource {
    type: DataSourceTypes.KnowledgeGraphLayer;
    layer: __esri.KnowledgeGraphLayer;
    createChildDataSourceOptionsById(childDsId: string, jimuChildId: string, childId: string): LayerFolderChildDataSourceConstructorOptions;
    getChildIds(): string[];
    ready(): Promise<void>;
}
