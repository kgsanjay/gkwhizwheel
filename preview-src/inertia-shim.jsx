import React from 'react';
const inform = () => { window.dispatchEvent(new CustomEvent('preview:info', {detail:'This is a visual preview of the original Laravel React homepage. Bookings and other pages require the live application.'})); };
export const Link = React.forwardRef(function PreviewLink({href = '/', as: Tag = 'a', children, onClick, ...props},ref){
  return <a {...props} href={href?.startsWith('#') ? href : '#'} ref={ref} onClick={(event)=>{if(onClick)onClick(event); if(!href?.startsWith('#')){event.preventDefault();inform();}}}>{children}</a>;
});
export const Head = ({children}) => null;
export function usePage(){return {url:'/', props:{auth:{user:null}, flash:{success:null,error:null}}};}
const blocked=()=>inform();
export const router = {visit:blocked,get:blocked,post:blocked,put:blocked,patch:blocked,delete:blocked,reload:blocked};
export const useForm = (initial={}) => ({data:initial,setData:()=>{},post:blocked,put:blocked,processing:false,errors:{},reset:()=>{},clearErrors:()=>{}});
export default {Link,Head,usePage,router,useForm};
