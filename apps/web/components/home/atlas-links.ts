import {
  getMarketplaceItemHref,
  type MarketplaceDepartment,
  type MarketplaceItem,
} from '@lefrig/shared';

export function itemLink(item: MarketplaceItem) {
  const base = getMarketplaceItemHref(item);
  return item.kind === 'listing' ? `${base.split('#')[0]!}` : base;
}

export function deptHref(dept: MarketplaceDepartment) {
  if (dept.id === 'services-shops') return '/services';
  const first = dept.items[0];
  return first ? itemLink(first) : '/marketplace';
}
