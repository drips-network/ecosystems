import {ethers, toBigInt} from 'ethers';

export default function calculateRandomSalt() {
  const randomBytes = ethers.randomBytes(32);
  return toBigInt(ethers.hexlify(randomBytes)) & toBigInt('0xFFFFFFFFFFFFFFFF');
}
