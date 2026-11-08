import React from 'react';

// GitHub Pages hosts only static UI. Map Laravel-style links to a query route,
// which survives reloads even though Pages has no Laravel route fallback.
const BASE = '/gkwhizwheel/';
const getPath = () => new URLSearchParams(window.location.search).get('page') || '/';
const isSafeInternalPath = (path) => typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');
const previewUrl = (path) => BASE + '?page=' + encodeURIComponent(path);
const inform = (message) => window.dispatchEvent(new CustomEvent('preview:info', {
  detail: message || 'Visual preview only. Login, bookings, payment and live availability require the staging website.'
}));
export const navigatePreview = (target) => {
  if (!isSafeInternalPath(target)) return inform();
  // Static preview deliberately does not impersonate API endpoints.
  if (/^\/(admin|api|account|login|register|auth|checkout)(\/|$)/.test(target)) return inform();
  window.location.assign(previewUrl(target));
};
export const Link = React.forwardRef(function PreviewLink(
  {href = '/', as: Tag = 'a', children, onClick, ...props}, ref
) {
  const safe = isSafeInternalPath(href);
  const destination = safe ? previewUrl(href) : '#';
  if (Tag !== 'a') {
    return <Tag {...props} ref={ref} onClick={event => {
      if (onClick) onClick(event);
      if (!event.defaultPrevented) navigatePreview(href);
    }}>{children}</Tag>;
  }
  return <a {...props} href={destination} ref={ref} onClick={event => {
    if (onClick) onClick(event);
    if (!safe) { event.preventDefault(); inform(); }
  }}>{children}</a>;
});
export const Head = () => null;
export function usePage() {
  return {
    url: getPath(),
    props: {auth: {user: null}, flash: {success: null, error: null}, errors: {}},
  };
}
const blocked = () => inform();
export const router = {
  visit: navigatePreview,
  get: (url) => navigatePreview(url),
  post: blocked, put: blocked, patch: blocked, delete: blocked, reload: blocked,
};
export const useForm = (initial={}) => ({
  data: initial, setData: () => {}, post: blocked, put: blocked,
  processing: false, errors: {}, reset: () => {}, clearErrors: () => {},
});
export default {Link, Head, usePage, router, useForm};
