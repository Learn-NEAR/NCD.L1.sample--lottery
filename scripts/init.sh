echo "deleting $CONTRACT"
echo
near delete $CONTRACT sherif.testnet

echo --------------------------------------------
echo
echo "cleaning up the /neardev folder"
rm -rf ./neardev

# exit on first error after this point to avoid redeploying with successful build
set -e

echo --------------------------------------------
echo
echo "rebuilding the contract (release build)"
yarn build:release

echo --------------------------------------------
echo
echo "redeploying the contract"
near dev-deploy ./build/release/lottery.wasm

echo --------------------------------------------
echo run the following commands
echo
echo 'export CONTRACT=< whatever comes out of dev-deploy >'
echo "near call \$CONTRACT init '{\"owner\":\"sherif.testnet\"}' --accountId \$CONTRACT"

exit 0
