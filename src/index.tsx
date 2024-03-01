import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { Button, Frog } from "frog";
import QRCode from "./utils/QRCode";

const projectId = "2a2a5978a58aad734d13a2d194ec469a";

const getConnectionURI = async () => {
  const provider = await EthereumProvider.init({
    projectId,
    showQrModal: false,
    chains: [324],
    methods: ["personal_sign"],
    metadata: {
      name: "WalletConnect Farcaster",
      description: "WalletConnect Farcaster Demo",
      url: "<https://walletconnect.com/>",
      icons: ["<https://avatars.githubusercontent.com/u/37784886>"],
    },
  });

  console.log("info: provider is initialized");

  const promise = new Promise<string>((resolve) => {
    provider.once("display_uri", (uri) => {
      console.log("info: display_uri is:", uri);
      resolve(uri);
    });
  });

  provider.connect();
  const response = await promise;

  return response;
};

export const app = new Frog({
  // Supply a Hub API URL to enable frame verification.
  //   hubApiUrl: "https://api.hub.wevm.dev",
});

app.frame("/", (c) => {
  return c.res({
    image: (
      <div tw="w-full h-full bg-slate-700 text-white justify-center items-center flex flex-col">
        <div tw="flex flex-row">
          <div tw="text-5xl">Press Connect to show QR Code</div>
        </div>
      </div>
    ),
    intents: [
      <Button value="connect" action="/connect">
        Connect
      </Button>,
    ],
  });
});

app.frame("/connect", async (c) => {
  const uri = await getConnectionURI();
  return c.res({
    action: "/connect",
    image: (
      <div
        tw="w-full h-full bg-slate-700 text-white justify-center items-center flex flex-col"
        style={{
          background: "linear-gradient(to right, #432889, #17101F)",
        }}
      >
        <QRCode uri={uri} size={304} />
      </div>
    ),
    intents: [
      <Button value="inc">Connect</Button>,
      <Button value="dec">Sign</Button>,
    ],
  });
});
