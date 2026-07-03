import './app.css'
import "cesium/Build/Cesium/Widgets/widgets.css";

import { Viewer as CesiumViewer, Ion } from 'cesium'
import { Editor } from './editor/editor';
import { MainLayout } from './misc/elements/main-layout';
import { useEffect, useState } from 'preact/hooks';
import { createContext } from 'preact';
import { createSelector } from './img-selector/integration';

const getArgs = new URLSearchParams(window.location.search);

const ionToken = getArgs.get('ionToken') || import.meta.env.VITE_CESIUM_ION_TOKEN;
if (ionToken) {
  Ion.defaultAccessToken = ionToken;
} else {
  console.warn('No Cesium Ion access token provided. Set VITE_CESIUM_ION_TOKEN or pass ?ionToken=<token>.');
}

export const ViewerContext = createContext<CesiumViewer| null>(null);

export function App() {

  const [viewer, setViewer] = useState<CesiumViewer| null>(null);
  useEffect(() => {
    if (viewer == null) {
      const vwr = new CesiumViewer('cesiumContainer', {
        animation: false,
        baseLayerPicker: getArgs.has('defaultBaseLayerPicker'),
        fullscreenButton: false,
        geocoder: true,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: true,
        timeline: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        scene3DOnly: true,
        shouldAnimate: true,
        msaaSamples: 1
      });

      const $tools = document.createElement('div');
      $tools.id = 'viewer-tools';

      vwr.container.querySelector('.cesium-viewer')?.appendChild($tools);

      createSelector(vwr);

      setViewer(vwr); 
    }
  }, [viewer, setViewer]);

  return (
    <MainLayout 
      sidebar={
        <ViewerContext value={viewer}>
          <Editor/>
        </ViewerContext>
      }
      mainArea={
        <div id={'cesiumContainer'}></div>
      }
    />
  );
}
