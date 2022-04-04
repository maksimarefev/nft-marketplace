pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

//todo arefev: add docs
interface IERC721Mintable is IERC721 {
    function mint(address to, string memory uri) external;
}
