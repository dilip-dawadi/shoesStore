import React from "react";

// import components
import ProductList from "../components/ProductList";
import Banner from "../components/Banner";
import { useProducts } from "../hooks/useProducts";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useNavigate } from "react-router-dom";
import { Package, Truck, ShieldCheck, Star } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = React.useState({
    page: 1,
    limit: 8,
    sort: "-createdAt",
    brand: "",
    category: "",
    price: "",
  });

  const { data, isLoading, error } = useProducts(filters);

  const features = [
    {
      icon: <Package className="h-8 w-8 text-primary" />,
      title: "Premium Quality",
      description: "Handpicked shoes from the best brands worldwide",
    },
    {
      icon: <Truck className="h-8 w-8 text-primary" />,
      title: "Fast Delivery",
      description: "Free shipping on orders above $5000",
    },
    {
      icon: <ShieldCheck className="h-8 w-8 text-primary" />,
      title: "Secure Payment",
      description: "100% secure payment with multiple options",
    },
    {
      icon: <Star className="h-8 w-8 text-primary" />,
      title: "Best Prices",
      description: "Competitive prices with amazing deals",
    },
  ];

  return (
    <div className="min-h-screen">
      <Banner setFilters={setFilters} />

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose Us
            </h2>
            <p className="text-muted-foreground text-lg">
              Experience the best shoe shopping with our premium services
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <ProductList
            data={data?.data || []}
            error={error?.message}
            loading={isLoading}
            title="Featured Products"
            limit={8}
          />
          <div className="text-center mt-8">
            <Button
              size="lg"
              onClick={() => navigate("/products")}
              className="px-8"
            >
              View All Products
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Step Into Comfort & Style
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Discover the perfect pair that matches your lifestyle. From casual
            sneakers to formal shoes, we have everything you need.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/products")}>
              Shop Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/products")}
            >
              Explore Collection
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
