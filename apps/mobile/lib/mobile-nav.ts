import type { Href } from 'expo-router';

/** Convierte rutas web (`/marketplace?category=x#listings`) a navegación Expo Router */
export function hrefFromWeb(webPath: string): Href {
  const pathOnly = webPath.split('#')[0];
  const [pathname, queryString] = pathOnly.split('?');
  if (!queryString) return pathname as Href;

  const params: Record<string, string> = {};
  new URLSearchParams(queryString).forEach((value, key) => {
    params[key] = value;
  });
  return { pathname: pathname as never, params };
}

export function curatedHref(slug: string): Href {
  if (slug === 'henna' || slug === 'agua-potable') {
    return { pathname: '/services', params: { category: slug } };
  }
  return { pathname: '/marketplace', params: { category: slug } };
}

export function deptHref(deptId: string, firstItemHref?: string): Href {
  if (deptId === 'services-shops') return '/services';
  if (firstItemHref) return hrefFromWeb(firstItemHref);
  return '/marketplace';
}
