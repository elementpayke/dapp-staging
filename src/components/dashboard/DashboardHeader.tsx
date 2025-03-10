import {
    ConnectWallet,
    Wallet,
} from '@coinbase/onchainkit/wallet';
import { Avatar, Name } from '@coinbase/onchainkit/identity';

const DashboardHeader = () => {
    return (
        <div className="h-16 flex items-center">
            <div className="p-4 ">
                <h1 className="text-2xl font-semibold flex items-center gap-2">
                    <span className="text-black">
                        <Wallet>
                            <ConnectWallet className="bg-transparent p-2 rounded-lg shadow-sm flex items-center gap-2 text-gray-400">
                                <Avatar className="bg-[#444] h-8 w-8 rounded-lg flex items-center justify-center"/>
                                <Name className="text-[#444] text-[22px]"/>
                            </ConnectWallet>
                        </Wallet>
                    </span>
                    <span className="text-xl">👋</span>
                </h1>
                <p className="text-gray-600">
                    Spend and deposit crypto into your ElementPay wallet instantly
                </p>
            </div>
        </div>
    );
};

export default DashboardHeader;
