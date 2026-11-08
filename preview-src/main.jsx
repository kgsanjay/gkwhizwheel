import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ColorModeProvider } from '../resources/js/theme/ColorModeContext.jsx';
import queryClient from '../resources/js/api/queryClient';
import Welcome from '../resources/js/Pages/Welcome.jsx';
import { navigatePreview } from './inertia-shim.jsx';
import '../resources/css/app.css';

// Every screen loads the actual React component from the UI branch. The
// reviewed homepage component intentionally stays unchanged.
const pages = {
  '/services': React.lazy(() => import('../resources/js/Pages/Services.jsx')),
  '/services/bikes': React.lazy(() => import('../resources/js/Pages/Bikes/Index.jsx')),
  '/services/cabs': React.lazy(() => import('../resources/js/Pages/CabsPage.jsx')),
  '/services/boating': React.lazy(() => import('../resources/js/Pages/BoatingPage.jsx')),
  '/services/scuba': React.lazy(() => import('../resources/js/Pages/ScubaPage.jsx')),
  '/services/homestays': React.lazy(() => import('../resources/js/Pages/HomestaysPage.jsx')),
  '/services/guide': React.lazy(() => import('../resources/js/Pages/GuidePage.jsx')),
  '/services/tours': React.lazy(() => import('../resources/js/Pages/ToursPage.jsx')),
  '/explore': React.lazy(() => import('../resources/js/Pages/ExplorePage.jsx')),
  '/about': React.lazy(() => import('../resources/js/Pages/About.jsx')),
  '/contact': React.lazy(() => import('../resources/js/Pages/Contact.jsx')),
  '/how-it-works': React.lazy(() => import('../resources/js/Pages/HowItWorks.jsx')),
  '/privacy': React.lazy(() => import('../resources/js/Pages/Privacy.jsx')),
  '/terms': React.lazy(() => import('../resources/js/Pages/Terms.jsx')),
};
const Detail = React.lazy(() => import('../resources/js/Pages/ServiceDetail.jsx'));
const stores = [
  {id: 1, name: 'Honnavar (preview)', public_name: 'Honnavar', city: 'Honnavar', slug: 'honnavar', address: 'Honnavar, Karnataka'},
  {id: 2, name: 'Murudeshwar (preview)', public_name: 'Murudeshwar', city: 'Murudeshwar', slug: 'murudeshwar', address: 'Murudeshwar, Karnataka'},
];
const featuredBikes = [
  {id: 1, brand: 'Honda', model_name: 'Dio DLX', daily_rate: 350, transmission: 'Automatic',
   primary_image_url: 'https://raw.githubusercontent.com/kgsanjay/gkwhizwheel/main/public/images/bikes/honda-dio-dlx.jpg', current_store: stores[0]},
  {id: 2, brand: 'Honda', model_name: "H'ness CB350", daily_rate: 1200, transmission: 'Manual',
   primary_image_url: 'https://raw.githubusercontent.com/kgsanjay/gkwhizwheel/main/public/images/bikes/honda-hness.jpg', current_store: stores[0]},
  {id: 3, brand: 'Royal Enfield', model_name: 'Classic 350', daily_rate: 1000, transmission: 'Manual',
   primary_image_url: 'https://raw.githubusercontent.com/kgsanjay/gkwhizwheel/main/public/images/bikes/royal-enfield-classic.jpg', current_store: stores[0]},
];
function Preview() {
  const [notice, setNotice] = useState('');
  const path = useMemo(() => new URLSearchParams(window.location.search).get('page') || '/', []);
  useEffect(() => {
    const onInfo = e => setNotice(e.detail);
    const onClick = e => {
      const a = e.target.closest?.('a');
      if (!a || e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      // Non-Inertia local links from Laravel also resolve to preview routes.
      if (href.startsWith('/') && !href.startsWith('/gkwhizwheel/')) {
        e.preventDefault();
        navigatePreview(href);
      }
    };
    const onSubmit = e => {
      e.preventDefault();
      setNotice('Forms and customer transactions are disabled in this design-only preview. Test them on staging.whizwheels.in.');
    };
    window.addEventListener('preview:info', onInfo);
    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit);
    return () => {
      window.removeEventListener('preview:info', onInfo);
      document.removeEventListener('click', onClick);
      document.removeEventListener('submit', onSubmit);
    };
  }, []);
  const Page = pages[path];
  const detailSlug = path.startsWith('/service/') ? path.split('/')[2] : null;
  const view = path === '/' ? <Welcome stores={stores} featuredBikes={featuredBikes} categories={[]} availableItems={[]} />
    : Page ? <Page stores={stores} categories={[]} availableItems={[]} initialFilters={{}} />
    : detailSlug ? <Detail slug={detailSlug} availableItems={[]} />
    : <div style={{padding: 60, textAlign: 'center'}}>
        <h2>That screen requires the live website</h2>
        <p>Only public page designs are available in this static preview.</p>
        <a href="/gkwhizwheel/">Return to homepage</a>
      </div>;
  return <>
    <div role="status" style={{position:'sticky',top:0,zIndex:2000,background:'#7c4d09',color:'#fff',
      padding:'7px 14px',textAlign:'center',fontSize:12,fontWeight:700}}>
      UI PREVIEW · Latest public pages from main · Demo content only · Bookings, payments and login disabled
      {' · '}<a href="https://staging.whizwheels.in/" style={{color:'#fff',textDecoration:'underline'}}>Open staging</a>
    </div>
    {notice && <div role="alert" onClick={() => setNotice('')}
      style={{position:'fixed',right:18,bottom:80,zIndex:2100,background:'#fff',color:'#142333',maxWidth:390,
        padding:16,borderRadius:10,boxShadow:'0 8px 30px #0005',cursor:'pointer'}}>
      {notice} <b>×</b>
    </div>}
    <Suspense fallback={<div role="status" style={{padding:80,textAlign:'center'}}>Loading UI preview…</div>}>
      {view}
    </Suspense>
  </>;
}
createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <ColorModeProvider><Preview /></ColorModeProvider>
  </QueryClientProvider>
);
