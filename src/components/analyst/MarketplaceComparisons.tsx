import React, { useState } from 'react';
import { Building2, DollarSign, TrendingUp } from 'lucide-react';

interface Property {
  address: string;
  price: number;
  sqft: number;
  pricePerSqft: number;
  daysOnMarket: number;
}

const MarketplaceComparisons: React.FC = () => {
  const [comparableProperties, setComparableProperties] = useState<Property[]>([
    {
      address: '123 Market St',
      price: 500000,
      sqft: 2000,
      pricePerSqft: 250,
      daysOnMarket: 30
    },
    {
      address: '456 Commerce Ave',
      price: 550000,
      sqft: 2200,
      pricePerSqft: 250,
      daysOnMarket: 45
    },
    {
      address: '789 Trade Blvd',
      price: 480000,
      sqft: 1900,
      pricePerSqft: 253,
      daysOnMarket: 15
    }
  ]);

  const [newProperty, setNewProperty] = useState<Partial<Property>>({
    address: '',
    price: 0,
    sqft: 0
  });

  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProperty.address && newProperty.price && newProperty.sqft) {
      const pricePerSqft = newProperty.price / newProperty.sqft;
      setComparableProperties([...comparableProperties, {
        ...newProperty as Property,
        pricePerSqft,
        daysOnMarket: 0
      }]);
      setNewProperty({ address: '', price: 0, sqft: 0 });
    }
  };

  const averagePrice = comparableProperties.reduce((acc, prop) => acc + prop.price, 0) / comparableProperties.length;
  const averagePricePerSqft = comparableProperties.reduce((acc, prop) => acc + prop.pricePerSqft, 0) / comparableProperties.length;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Market Analysis</h2>
        <p className="text-gray-600">Compare property metrics with similar properties in the market.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-gray-700">Average Price</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${averagePrice.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-700">Avg. Price per SqFt</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${averagePricePerSqft.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-8">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Comparable Properties</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SqFt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">$/SqFt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days on Market</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {comparableProperties.map((property, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.address}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${property.price.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.sqft.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${property.pricePerSqft.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.daysOnMarket}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Add Comparable Property</h3>
        </div>
        <form onSubmit={handleAddProperty} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                id="address"
                value={newProperty.address}
                onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter address"
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price
              </label>
              <input
                type="number"
                id="price"
                value={newProperty.price || ''}
                onChange={(e) => setNewProperty({ ...newProperty, price: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter price"
              />
            </div>

            <div>
              <label htmlFor="sqft" className="block text-sm font-medium text-gray-700 mb-2">
                Square Footage
              </label>
              <input
                type="number"
                id="sqft"
                value={newProperty.sqft || ''}
                onChange={(e) => setNewProperty({ ...newProperty, sqft: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter square footage"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Property
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MarketplaceComparisons;