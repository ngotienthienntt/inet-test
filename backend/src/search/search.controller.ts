import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';

@ApiTags('Search')
@Throttle({ short: { ttl: 1000, limit: 10 }, medium: { ttl: 60000, limit: 200 } })
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search products', description: 'Full-text search with filters, sorting and pagination' })
  @ApiQuery({ name: 'q', required: false, description: 'Full-text search term' })
  @ApiQuery({ name: 'category', required: false, description: 'Category slug(s), comma-separated for multi-select' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price filter' })
  @ApiQuery({ name: 'sort', required: false, enum: ['price_asc', 'price_desc', 'newest', 'relevance'], description: 'Sort order' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  search(@Query() dto: SearchQueryDto) {
    return this.searchService.search(dto);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Search suggestions', description: 'Fast typeahead suggestions (responds under 200ms)' })
  @ApiQuery({ name: 'q', required: true, description: 'Search term for suggestions' })
  suggestions(@Query('q') q: string) {
    return this.searchService.suggestions(q ?? '');
  }
}
