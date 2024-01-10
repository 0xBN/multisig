import { NextPage } from "next";
import { useAccount } from "wagmi";
import CreateMultisigForm from "~~/components/CreateMultisigForm";
import { MetaHeader } from "~~/components/MetaHeader";

interface TestData {
  id: string;
  title: string;
  content: string;
}

interface HomeProps {
  data: TestData[];
}

const Home: NextPage<HomeProps> = () => {
  const { isConnected } = useAccount();
  return (
    <>
      <MetaHeader />
      {isConnected ? (
        <CreateMultisigForm />
      ) : (
        <div className="text-4xl font-bold mb-4 p-8 text-center">
          <p>Please connect your wallet to create a multisig wallet.</p>
        </div>
      )}
    </>
  );
};

export default Home;
