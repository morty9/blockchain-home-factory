pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "./Ownable.sol";
import "./Safemath.sol";

contract HomeFactory is Ownable {

  using SafeMath for uint256;

  event NewHome(uint homeId, string homeAddress, uint homePrice, string homePicture);
  event Transfer(address indexed _from, address indexed _to, uint256 _value);

  struct Home {
    string homeAddress;
    uint homePrice;
    string homePicture;
    address homeOwner;
  }

  Home[] public homes;

  modifier hasMoney(uint value) {
    require(msg.value >= value);
    _;
  }

  mapping (uint => address) public homeToOwner;
  mapping (address => uint) ownerHomeCount;
  mapping (address => uint) balances;

  constructor() public {

  }

  function _createHome(string memory _homeAddress, uint _homePrice, string memory _homePicture) public {
    uint id = homes.push(Home(_homeAddress, _homePrice, _homePicture, msg.sender)) - 1;
    homeToOwner[id] = msg.sender;
    ownerHomeCount[msg.sender] = ownerHomeCount[msg.sender].add(1);
    emit NewHome(id, _homeAddress, _homePrice, _homePicture);
  }

  function getHomes() external view returns(uint[] memory) {
    uint[] memory indexes = new uint[](homes.length - ownerHomeCount[msg.sender]);
    uint counter = 0;
    for (uint i = 0; i < homes.length; i++) {
      if (homeToOwner[i] != msg.sender) {
        indexes[counter] = i;
        counter++;
      }
    }
    return indexes;
  }

  function getHomesByOwner(address _owner) external view returns(uint[] memory) {
    uint[] memory result = new uint[](ownerHomeCount[_owner]);
    uint counter = 0;
    for (uint i = 0; i < homes.length; i++) {
      if (homeToOwner[i] == _owner) {
        result[counter] = i;
        counter++;
      }
    }
    return result;
  }

  function getHomeByIndex(uint _index) external view returns(string memory, uint, string memory, address, uint) {
    string memory currentHomeAddress;
    uint currentHomePrice;
    string memory currentHomePicture;
    address currentHomeOwner;
    uint homeIndex;
    for (uint i = 0; i < homes.length; i++) {
      if (_index == i) {
        currentHomeAddress = homes[i].homeAddress;
        currentHomePrice = homes[i].homePrice;
        currentHomePicture = homes[i].homePicture;
        currentHomeOwner = homes[i].homeOwner;
        homeIndex = i;
      }
    }
    return (currentHomeAddress, currentHomePrice, currentHomePicture, currentHomeOwner, homeIndex);
  }

  function updateOwner(address addressOldOwner, uint position) private {
    for (uint i = 0; i < homes.length; i++) {
      if (i == position) {
        homes[i].homeOwner = msg.sender;
        homeToOwner[position] = msg.sender;
        ownerHomeCount[msg.sender]++;
        ownerHomeCount[addressOldOwner]--;
      }
    }
  }

  function sendCoinToBuyHome(address receiverAddress, uint homeIndex, uint homePrice) public hasMoney(homePrice) payable  {
     msg.sender.transfer(msg.value);
     updateOwner(receiverAddress, homeIndex);
	}

}
