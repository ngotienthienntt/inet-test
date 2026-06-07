import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

export const ELASTICSEARCH_CLIENT = 'ELASTICSEARCH_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: ELASTICSEARCH_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new Client({
          node: config.get<string>('ES_NODE') ?? 'http://localhost:9200',
        });
      },
    },
  ],
  exports: [ELASTICSEARCH_CLIENT],
})
export class ElasticsearchModule {}
