import { store, intercept, currentMediaItem } from "@neptune";
import { getMediaURLFromID } from "@neptune/utils";
import { AutoClient } from "discord-auto-rpc";

const unloadables = [];
const clientId = "1130698654987067493";

const formatLongString = (s) => (s.length >= 128 ? s.slice(0, 125) + "..." : s);

const rpc = new AutoClient.Client({ transport: 'ipc' });
const client = rpc.endlessLogin({ clientId });

client.then(() => {
  unloadables.push(
    intercept("playbackControls/TIME_UPDATE", ([current]) => {
      const state = store.getState();

      const { item: currentlyPlaying, type: mediaType } = currentMediaItem;

      // TODO: add video support
      if (mediaType != "track") return;

      const albumArtURL = getMediaURLFromID(currentlyPlaying.album.cover);

      const date = new Date();
      const now = (date.getTime() / 1000) | 0;
      const remaining = date.setSeconds(
        date.getSeconds() + (currentlyPlaying.duration - current)
      );

      const paused = state.playbackControls.playbackState == "NOT_PLAYING";

      rpc.setActivity({
        ...(paused
          ? {
              smallImageKey: "paused-icon",
              smallImageText: "Paused",
            }
          : {
              smallImageText: "CHEWAWI IS THE GOAT!",
              smallImageKey: 'tidal',
              startTimestamp: now,
              endTimestamp: remaining,
            }),
        details: formatLongString(currentlyPlaying.title),
        state: formatLongString(
          "by " + currentlyPlaying.artists.map((a) => a.name).join(", ")
        ),
        largeImageKey: albumArtURL,
        largeImageText: formatLongString(currentlyPlaying.album.title),
      });
    })
  );
});

export async function onUnload() {
  const resolvedClient = await client;
  unloadables.forEach((u) => u());

  try {
    resolvedClient.clearActivity();
    resolvedClient.destroy();
  } catch {}
}
