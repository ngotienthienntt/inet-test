import { PaginatedResult } from '../common/types/index';
import { SearchQueryDto } from './dto/search-query.dto';
import { ProductDocument } from './product-document.mapper';

export const SEARCH_SERVICE = 'SEARCH_SERVICE';

export interface ISearchService {
  search(dto: SearchQueryDto): Promise<PaginatedResult<ProductDocument>>;
  suggestions(q: string): Promise<Pick<ProductDocument, 'id' | 'name' | 'category'>[]>;
}
