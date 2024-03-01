import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { Button, Frog } from "frog";
import QRCode from "./utils/QRCode";

const projectId = "2a2a5978a58aad734d13a2d194ec469a";

const bgColor = {
  backgroundColor: "#121529",
};

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
      <div
        style={bgColor}
        tw="w-full h-full text-white justify-center items-center flex flex-col"
      >
        <div tw="flex flex-row">
          <div tw="text-5xl">Press Connect to show QR Code</div>
        </div>
      </div>
    ),
    imageAspectRatio: "1:1",
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
        style={bgColor}
      >
        <QRCode uri={uri} size={500} />
      </div>
    ),
    imageAspectRatio: "1:1",
    intents: [<Button value="dec">Sign</Button>],
  });
});
