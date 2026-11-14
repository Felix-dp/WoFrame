import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {episodeComposition, validateEpisode} from './episode.mjs';
import {EpisodeVideo} from './EpisodeVideo.jsx';

function RenderRoot() {
  return <Composition id="WoFrameEpisode" component={EpisodeVideo}
    width={1080} height={1920} durationInFrames={1} fps={30}
    calculateMetadata={({props}) => {
      const project = validateEpisode(props.project);
      return {...episodeComposition(project), props: {project}};
    }} />;
}

registerRoot(RenderRoot);
