import {encodeBytes32String, hexlify, toUtf8Bytes} from 'ethers';
import {OxString} from '../../../../common/domain/types';

export default function keyValueToMetatada({
  key,
  value,
}: {
  key: string;
  value: string;
}) {
  return {
    key: encodeBytes32String(key) as OxString,
    value: hexlify(toUtf8Bytes(value)) as OxString,
  };
}
