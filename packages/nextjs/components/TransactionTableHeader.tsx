import React from "react";

const TransactionTableHeader = ({ headers }) => {
  return (
    <thead>
      <tr>
        {headers.map(header => (
          <th key={header.key} className="border border-gray-300 text-xs">
            {header.title}
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default TransactionTableHeader;
