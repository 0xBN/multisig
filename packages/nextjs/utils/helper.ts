export const parseErrorMessage = (errorMsg: string): string => {
  const indexOfFirstParen = errorMsg.indexOf("(");
  return indexOfFirstParen === -1 ? errorMsg : errorMsg.substring(0, indexOfFirstParen).trim();
};

export const truncateAddress = (address: string): string => {
  return `${address?.substring(0, 6)}...${address?.substring(address.length - 4)}`;
};
