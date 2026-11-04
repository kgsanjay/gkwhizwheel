import React, {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClientProvider} from '@tanstack/react-query';
import {ColorModeProvider} from '../resources/js/theme/ColorModeContext.jsx';
import queryClient from '../resources/js/api/queryClient';
import Welcome from '../resources/js/Pages/Welcome.jsx';
import '../resources/css/app.css';

if(!localStorage.getItem('whizwheel_color_mode')) localStorage.setItem('whizwheel_color_mode','dark');
// Demonstration fixtures ONLY. All visual components below come directly from the restored original React code.
const stores=[
{id:1,name:'GK WhizWheels Main Office',public_name:'Honnavar',city:'Honnavar',slug:'honnavar',address:'Palya Main Rd, Honnavar, Karnataka 581334'},
{id:2,name:'GK WhizWheels Murudeshwar Hub',public_name:'Murudeshwar',city:'Murudeshwar',slug:'murudeshwar',address:'Murudeshwar, Karnataka'}
];
const featuredBikes=[
{id:1,brand:'Honda',model_name:'Dio DLX',daily_rate:350,transmission:'Automatic',primary_image_url:'https://raw.githubusercontent.com/kgsanjay/gkwhizwheel/main/public/images/bikes/honda-dio-dlx.jpg',current_store:stores[0]},
{id:2,brand:'Honda',model_name:"H'ness CB350",daily_rate:1200,transmission:'Manual',primary_image_url:'https://raw.githubusercontent.com/kgsanjay/gkwhizwheel/main/public/images/bikes/honda-hness.jpg',current_store:stores[0]},
{id:3,brand:'Royal Enfield',model_name:'Classic 350',daily_rate:1000,transmission:'Manual',primary_image_url:'https://raw.githubusercontent.com/kgsanjay/gkwhizwheel/main/public/images/bikes/royal-enfield-classic.jpg',current_store:stores[0]}
];
function Preview(){
const [notice,setNotice]=useState('');
useEffect(()=>{const fn=e=>setNotice(e.detail);window.addEventListener('preview:info',fn);const click=e=>{const a=e.target.closest?.('a');if(a && !a.getAttribute('href')?.startsWith('#') && a.hostname===window.location.hostname){e.preventDefault();setNotice('Other pages and bookings are disabled in this visual-only preview.');}};document.addEventListener('click',click);return()=>{window.removeEventListener('preview:info',fn);document.removeEventListener('click',click);};},[]);
return <><div role="status" style={{position:'sticky',top:0,zIndex:2000,background:'#7c4d09',color:'#fff',padding:'6px 12px',textAlign:'center',fontSize:12,fontWeight:700}}>ORIGINAL REACT HOMEPAGE PREVIEW — Sample branch and fleet data; booking and payment disabled.</div>{notice&&<div role="alert" onClick={()=>setNotice('')} style={{position:'fixed',right:18,bottom:80,zIndex:2100,background:'#fff',color:'#142333',maxWidth:390,padding:16,borderRadius:10,boxShadow:'0 8px 30px #0005',cursor:'pointer'}}>{notice} <b>×</b></div>}<Welcome stores={stores} featuredBikes={featuredBikes} categories={[]} availableItems={[]} /></>;
}
createRoot(document.getElementById('root')).render(<QueryClientProvider client={queryClient}><ColorModeProvider><Preview/></ColorModeProvider></QueryClientProvider>);
