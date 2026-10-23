(function(){
const place={3:{name:['成田','Narita','Narita'],lat:35.776,lon:140.318},4:{name:['日光','Nikko','Nikko'],lat:36.748,lon:139.598},5:{name:['日光','Nikko','Nikko'],lat:36.748,lon:139.598},6:{name:['日光','Nikko','Nikko'],lat:36.748,lon:139.598},7:{name:['嬬恋','Tsumagoi','Tsumagoi'],lat:36.517,lon:138.522},8:{name:['安曇野','Azumino','Azumino'],lat:36.304,lon:137.902},9:{name:['高山','Takayama','Takayama'],lat:36.146,lon:137.252},10:{name:['高山','Takayama','Takayama'],lat:36.146,lon:137.252},11:{name:['高山','Takayama','Takayama'],lat:36.146,lon:137.252},12:{name:['上松','Agematsu','Agematsu'],lat:35.783,lon:137.693},13:{name:['中津川','Nakatsugawa','Nakatsugawa'],lat:35.488,lon:137.501},14:{name:['中津川','Nakatsugawa','Nakatsugawa'],lat:35.488,lon:137.501},15:{name:['精進湖','Lake Shoji','Shoji-meer'],lat:35.493,lon:138.605},16:{name:['下田','Shimoda','Shimoda'],lat:34.679,lon:138.945},17:{name:['下田','Shimoda','Shimoda'],lat:34.679,lon:138.945},18:{name:['下田','Shimoda','Shimoda'],lat:34.679,lon:138.945},19:{name:['成田（到着地）','Narita (destination)','Narita (bestemming)'],lat:35.776,lon:140.318},20:{name:['成田','Narita','Narita'],lat:35.776,lon:140.318}};
const labels={ja:{beyond:'この日付は予報期間外です。日が近づくと自動更新されます。',fail:'天気を取得できませんでした。通信を確認してください。',updated:'更新',clear:'晴れ',mostly:'おおむね晴れ',part:'晴れ時々くもり',cloud:'くもり',fog:'霧',drizzle:'霧雨',rain:'雨',snow:'雪',showers:'にわか雨',storm:'雷雨',precip:'降水確率',max:'最高',min:'最低',area:'予報地点'},en:{beyond:'Outside the forecast window. This updates automatically as the date approaches.',fail:'Weather unavailable. Check your connection.',updated:'Updated',clear:'Clear',mostly:'Mostly clear',part:'Partly cloudy',cloud:'Cloudy',fog:'Fog',drizzle:'Drizzle',rain:'Rain',snow:'Snow',showers:'Showers',storm:'Thunderstorm',precip:'Precipitation',max:'High',min:'Low',area:'Forecast area'},nl:{beyond:'Buiten de voorspellingsperiode. Wordt automatisch bijgewerkt naarmate de datum dichterbij komt.',fail:'Weer niet beschikbaar. Controleer je verbinding.',updated:'Bijgewerkt',clear:'Helder',mostly:'Overwegend helder',part:'Gedeeltelijk bewolkt',cloud:'Bewolkt',fog:'Mist',drizzle:'Motregen',rain:'Regen',snow:'Sneeuw',showers:'Regenbuien',storm:'Onweer',precip:'Neerslagkans',max:'Max',min:'Min',area:'Voorspellingsgebied'}};
const wx=(code,l)=>{let k=code===0?'clear':[1].includes(code)?'mostly':[2].includes(code)?'part':[3].includes(code)?'cloud':[45,48].includes(code)?'fog':[51,53,55,56,57].includes(code)?'drizzle':[61,63,65,66,67].includes(code)?'rain':[71,73,75,77,85,86].includes(code)?'snow':[80,81,82].includes(code)?'showers':[95,96,99].includes(code)?'storm':'cloud';return labels[l][k]};
const cacheKey='trip-live-weather-v1',ttl=6*60*60*1000;
let cache={};try{cache=JSON.parse(localStorage.getItem(cacheKey)||'{}')}catch{}
let pending=null,currentLang='ja';
const api=(p)=>'https://api.open-meteo.com/v1/forecast?latitude='+p.lat+'&longitude='+p.lon+'&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo&forecast_days=16';
async function load(){
 const unique={};Object.values(place).forEach(p=>unique[p.name[0]]=p);
 await Promise.all(Object.entries(unique).map(async([key,p])=>{if(cache[key]&&Date.now()-cache[key].fetchedAt<ttl)return;try{const r=await fetch(api(p),{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const data=await r.json();if(!data.daily||!Array.isArray(data.daily.time))throw Error('missing daily forecast');cache[key]={fetchedAt:Date.now(),data,url:api(p)};localStorage.setItem(cacheKey,JSON.stringify(cache))}catch(e){if(cache[key])cache[key].error=true;else cache[key]={fetchedAt:0,error:true,url:api(p)}}}));
}
function paint(){
 const l=currentLang,idx=['ja','en','nl'].indexOf(l),t=labels[l]||labels.ja;
 for(const [day,p] of Object.entries(place)){
  const el=document.getElementById('weather-live-'+day),loc=document.getElementById('weather-area-'+day),src=document.getElementById('weather-api-'+day);if(!el)continue;if(!el.dataset.fallback)el.dataset.fallback=el.textContent;
  if(loc)loc.textContent=p.name[idx]+' · '+t.area;
  const entry=cache[p.name[0]],date='2026-11-'+String(day).padStart(2,'0');
  if(src)src.href=entry&&entry.url?entry.url:api(p);
  const pos=entry&&entry.data&&entry.data.daily.time.indexOf(date);
  if(pos>=0){const d=entry.data.daily,tempMax=d.temperature_2m_max[pos],tempMin=d.temperature_2m_min[pos],pop=d.precipitation_probability_max?.[pos],time=new Date(entry.fetchedAt).toLocaleTimeString(l==='nl'?'nl-NL':l==='en'?'en-GB':'ja-JP',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Tokyo'});const parts=[wx(d.weather_code[pos],l),tempMax!=null?t.max+' '+Math.round(tempMax)+'°':null,tempMin!=null?t.min+' '+Math.round(tempMin)+'°':null,pop!=null?t.precip+' '+Math.round(pop)+'%':null].filter(Boolean);el.textContent=parts.join(' · ')+' · '+t.updated+' '+time+' JST'}
  else if(entry&&entry.error)el.textContent=t.fail+' · '+el.dataset.fallback;
  else el.textContent=t.beyond;
 }
}
window.refreshLiveWeather=function(lang){currentLang=lang||currentLang;if(pending){paint();return pending}paint();pending=load().then(paint).catch(()=>paint()).finally(()=>{pending=null});return pending};
window.setInterval(()=>window.refreshLiveWeather(currentLang),ttl);
})();
