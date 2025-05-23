import './app.css'
import "cesium/Build/Cesium/Widgets/widgets.css";

import { Viewer as CesiumViewer, Ion } from 'cesium'
import { Editor } from './editor/editor';
import { MainLayout } from './misc/elements/main-layout';
import { useEffect, useState } from 'preact/hooks';
import { createContext } from 'preact';
import { createSelector } from './img-selector/integration';

const getArgs = new URLSearchParams(window.location.search);

Ion.defaultAccessToken = getArgs.get('ionToken') || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmZjBlYmNhMy0yY2RiLTQxZmQtOTk5Ny00NDE4YTBjMTI4M2YiLCJpZCI6MTEwMzQ1LCJpYXQiOjE3NDM1MzgyNjl9.BEY-3Gs-JVELjQq_Hegq5i_TMcWheejiTnauWSH7qxA';

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
