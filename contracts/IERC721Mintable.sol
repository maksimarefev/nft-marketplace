pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IERC721Mintable is IERC721 {

    /**
      * @notice Mints a new token with the `uri` to the `to` address
      * @param to is the recipient address
      * @param uri is the content identifier of a token's metadata
      */
    function mint(address to, string memory uri) external;
}
