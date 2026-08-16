import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBannerDto } from './create-banner.dto';
import { BannerPosition } from '../banner-position.enum';

const VALID_BASE = {
  position: BannerPosition.HOMEPAGE_BEFORE_CATEGORIES,
  imageUrl: 'http://localhost:3001/uploads/products/1234-banner.jpg',
  altText: 'Banner khuyến mãi điện thoại',
};

async function validateLinkUrl(linkUrl: unknown) {
  const dto = plainToInstance(CreateBannerDto, { ...VALID_BASE, linkUrl });
  return validate(dto);
}

describe('CreateBannerDto linkUrl validation', () => {
  it('accepts a relative path with a query string', async () => {
    const errors = await validateLinkUrl('/shop?category=dien-thoai');
    expect(errors).toHaveLength(0);
  });

  it('accepts a bare relative path', async () => {
    const errors = await validateLinkUrl('/shop');
    expect(errors).toHaveLength(0);
  });

  it('accepts an absolute http(s) URL', async () => {
    const errors = await validateLinkUrl('http://localhost:3000/shop');
    expect(errors).toHaveLength(0);
  });

  it('rejects a javascript: scheme', async () => {
    const errors = await validateLinkUrl('javascript:alert(1)');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects an arbitrary string that is not a URL or path', async () => {
    const errors = await validateLinkUrl('not a url at all with spaces');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('passes when linkUrl is omitted entirely', async () => {
    const dto = plainToInstance(CreateBannerDto, { ...VALID_BASE });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('passes when linkUrl is explicitly null', async () => {
    const errors = await validateLinkUrl(null);
    expect(errors).toHaveLength(0);
  });
});
