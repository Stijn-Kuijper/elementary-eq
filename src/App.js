import './App.css';
import { useEffect, useState } from 'react';
import { ElementaryPluginRenderer as core, el } from '@nick-thompson/elementary';

export default function App() {

  let [loaded, setLoaded] = useState(false);

  let [params, setParams] = useState([
    {key: 'eq1', fc: 1000, q: 1.414, g: 3, type: 'highshelf', bypass: false, channels: 'stereo'},
    {key: 'eq2', fc: 10000, q: 0.717, g: -3, type: 'peak', bypass: false, channels: 'left'},
    {key: 'eq3', fc: 100, q: 0.2, g: 3, type: 'highpass', bypass: false, channels: 'stereo'}
  ])

  const setParamFloat = (i, e, param) => {
    let newState = [...params];

    newState[i] = Object.assign(newState[i], {
      [param]: parseFloat(e.target.value)
    });

    setParams(newState);
  }

  const setParamChoice = (i, e, param) => {
    let newState = [...params];

    newState[i] = Object.assign(newState[i], {
      [param]: e.target.value
    });

    setParams(newState);
  }

  const toggleParamBool = (i, param) => {
    let newState = [...params];

    newState[i] = Object.assign(newState[i], {
      [param]: !newState[i][param]
    });

    setParams(newState);
  }

  const getFilter = (band) => {
    const fc = el.const({key: `${band.key}:fc`, value: band.fc});
    const q  = el.const({key: `${band.key}:q`,  value: band.q});
    const g  = el.const({key: `${band.key}:g`,  value: band.g});

    let filterFunc;
    switch (band.type) {
      case 'bandpass':  filterFunc = (x) => el.bandpass(fc, q, x); break;
      case 'highpass':  filterFunc = (x) => el.highpass(fc, q, x); break;
      case 'highshelf': filterFunc = (x) => el.highshelf(fc, q, g, x); break;
      case 'lowpass':   filterFunc = (x) => el.lowpass(fc, q, x); break;
      case 'lowshelf':  filterFunc = (x) => el.lowshelf(fc, q, g, x); break;
      case 'notch':     filterFunc = (x) => el.notch(fc, q, x); break;
      case 'peak':      filterFunc = (x) => el.peak(fc, q, g, x); break;
      default:          filterFunc = (x) => el.peak(fc, q, g, x); break;
    }
    return filterFunc;
  }

  const applyBand = (band, left, right) => {
    if (band.bypass) return {l: left, r: right};
    const filter = getFilter(band);
    // return variables
    let l, r

    if (band.channels === 'mid' || band.channels === 'side') {
      // encode L/R to M/S
      let mid = el.mul(0.5, el.add(left, right));
      let side = el.mul(0.5, el.sub(left, right));
      // apply filter on appropriate channel
      let m = (band.channels === 'mid')  ? filter(mid)  : mid;
      let s = (band.channels === 'side') ? filter(side) : side;
      // decode M/S to L/R
      l = el.add(m, s);
      r = el.sub(m, s);
    } else {
      // apply filter on appropriate channel(s)
      l = (band.channels === 'stereo' || band.channels === 'left')
        ? filter(left) : left;
      r = (band.channels === 'stereo' || band.channels === 'right')
        ? filter(right) : right;
    }
    // return the filtered left and right channel
    return {l, r}
  }
  
  useEffect(() => {
    core.on('load', function(e) {
      setLoaded(true);
    })

    core.initialize();
  }, []);

  useEffect(function() {
    if (!loaded) return;

    const left  = el.in({channel: 0});
    const right = el.in({channel: 1});

    const {l, r} = params.reduce(
      (previous, current) => applyBand(current, previous.l, previous.r),
      {l: left, r: right} // initial value
    );

    core.render(l, r);
  });

  const bands = [];
  for (let i = 0; i < params.length; i++){
    bands.push(
      <div key={i}>
        <input
          type="range"
          min="20"
          max="2000"
          value={params[i].fc}
          onInput={(e) => setParamFloat(i, e, 'fc')} />
        <code>{params[i].fc}</code>
        <input
          type="range"
          min="0.05"
          max="40"
          value={params[i].q}
          onInput={(e) => setParamFloat(i, e, 'q')} />
        <code>{params[i].q}</code>
        <input
          type="range"
          min="-30"
          max="30"
          value={params[i].g}
          onInput={(e) => setParamFloat(i, e, 'g')} />
        <code>{params[i].g}</code>
        <select
          value={params[i].type}
          onChange={(e) => setParamChoice(i, e, 'type')}>
          <option value="bandpass">bandpass</option>
          <option value="highpass">highpass</option>
          <option value="highshelf">highshelf</option>
          <option value="lowpass">lowpass</option>
          <option value="lowshelf">lowshelf</option>
          <option value="notch">notch</option>
          <option value="peak">peak</option>
        </select>
        <input
          type="checkbox"
          defaultChecked={params[i].bypass}
          onChange={() => toggleParamBool(i, 'bypass')} />
        <code>bypass</code>
        <select 
          value={params[i].channels} 
          onChange={(e) => setParamChoice(i, e, 'channels')}>
          <option value="left">left</option>
          <option value="right">right</option>
          <option value="stereo">stereo</option>
          <option value="mid">mid</option>
          <option value="side">side</option>
        </select>
      </div>
    )
  }

  return (
    <div>
      {bands}
    </div>
  )
}
