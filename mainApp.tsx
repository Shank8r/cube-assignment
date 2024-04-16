import React, { useState, useEffect, useRef } from 'react';
import '../App.css';

interface Customer {
  id: number;
  name: string;
  company: string;
  address: string;
}

const Main: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerPhotos, setCustomerPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [startIndex, setStartIndex] = useState<number>(0);
  const limit = 5;

  const observer = useRef<IntersectionObserver | null>(null);
  const lastCustomerElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetching initial set of customers
    fetchInitialCustomers();
  }, [startIndex]);

  useEffect(() => {
    // Setting up Intersection Observer
    observer.current = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    });

    if (lastCustomerElementRef.current) {
      observer.current.observe(lastCustomerElementRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [customers]);

  useEffect(() => {
    // Fetching new photos for the selected customer every 10 seconds
    const intervalId = setInterval(fetchNewPhotos, 10000);
    return () => clearInterval(intervalId);
  }, [selectedCustomer]);

  const fetchInitialCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://660ead7a356b87a55c4fbd26.mockapi.io/customer/users');
      const data = await response.json();
      const slicedData = data.slice(startIndex, startIndex + limit);
      setCustomers(prevCustomers => [...prevCustomers, ...slicedData]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching customers: ', error);
      setIsLoading(false);
    }
  };

  const handleIntersection: IntersectionObserverCallback = (entries) => {
    const target = entries[0];
    if (target.isIntersecting) {
      // Load more customers
      setStartIndex(startIndex + limit);
    }
  };

  const selectCustomer = async (selectedCustomer: Customer) => {
    setSelectedCustomer(selectedCustomer);
    // Fetching new photos for the selected customer
    const newPhotoPromises = Array.from(Array(9).keys()).map((_, index) =>
      fetch(`https://source.unsplash.com/random/200x200?sig=${index + 1000}`) // Adding 1000 to ensure different photos
        .then(response => response.url)
    );

    try {
      const newPhotos = await Promise.all(newPhotoPromises);
      setCustomerPhotos(newPhotos);
    } catch (error) {
      console.error('Error fetching new photos: ', error);
    }
  };

  const fetchNewPhotos = async () => {
    if (selectedCustomer) {
      const newPhotoPromises = Array.from(Array(9).keys()).map((_, index) =>
        fetch(`https://source.unsplash.com/random/200x200?sig=${index + 2000}`) // Adding 2000 to ensure different photos from the initial set
          .then(response => response.url)
      );

      try {
        const newPhotos = await Promise.all(newPhotoPromises);
        setCustomerPhotos(newPhotos);
      } catch (error) {
        console.error('Error fetching new photos: ',error);
      }
    }
  };

  return (
    <div className='main'>
      <h1>Customer Info with random images
      </h1>
      <div className="App">
        <div className="customer-list" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {customers.map((customer, index) => (
            <div
              key={customer.id}
              ref={index === customers.length - 1 ? lastCustomerElementRef : null}
              className={`customer-card ${selectedCustomer && selectedCustomer.id === customer.id ? 'selected' : ''}`}
              onClick={() => selectCustomer(customer)}
            >
              <h3>{customer.name}</h3>
              <p>{customer.company}</p>
            </div>
          ))}
          {isLoading && <p>Loading...</p>}
        </div>
        <div className="customer-details">
          {selectedCustomer && (
            <div>
              <h2>{selectedCustomer.name}</h2>
              <p><b>Title</b>: {selectedCustomer.company}</p>
              <p><b>Address</b>: {selectedCustomer.address}, {selectedCustomer.company}</p>
              <div className="photo-grid">
                {customerPhotos.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Photo ${index}`}
                    style={{borderRadius: '10px'}}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Main;