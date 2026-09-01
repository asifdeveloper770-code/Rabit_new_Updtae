import { useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase, Product } from "@/lib/supabase";

export interface DatabaseVariant {
  id?: string;

  // IMPORTANT:
  // This is products.uuid_id, NOT products.id
  product_id?: string;
  id_number: string;
  cas_number: string | null;
  specification: string;
  price: number;
  quantity: number;
  stock: number;
  img: string | null;
  created_at?: string;
  // Frontend-only fields
  imageFile?: File | null;
  imagePreview?: string;
}

export interface ExtendedProduct extends Product {
  slug: any;
  product_variations?: DatabaseVariant[];
}

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

function AdminProducts() {
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Core Product Form State
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [price, setPrice] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [accent, setAccent] = useState<"blue" | "green">("blue");
  const [category, setCategory] = useState<"Injectables" | "Oral" | "Peptides">("Peptides");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");

  // Dynamic Variants Form State
  const [variants, setVariants] = useState<DatabaseVariant[]>([
    {
      id_number: "",
      cas_number: "",
      specification: "5mg Vial",
      price: 0,
      quantity: 0,
      stock: 100,
      img: "",
      imageFile: null,
      imagePreview: "",
    },
  ]);
  // Master Products Pagination State
  const [productCurrentPage, setProductCurrentPage] = useState(1);
  const [productItemsPerPage, setProductItemsPerPage] = useState(5);
  // Calculate total pages for Master Products
  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();

    if (!search) return products;

    return products.filter((product) => {
      return (
        product.name?.toLowerCase().includes(search) ||
        product.id?.toLowerCase().includes(search) ||
        product.category?.toLowerCase().includes(search) ||
        product.tag?.toLowerCase().includes(search) ||
        product.slug?.toLowerCase().includes(search)
      );
    });
  }, [products, productSearch]);

  const totalProductPages =
    Math.ceil(filteredProducts.length / productItemsPerPage) || 1;

  const paginatedProducts = useMemo(() => {
    const startIndex = (productCurrentPage - 1) * productItemsPerPage;

    return filteredProducts.slice(
      startIndex,
      startIndex + productItemsPerPage
    );
  }, [filteredProducts, productCurrentPage, productItemsPerPage]);

  useEffect(() => {
    setProductCurrentPage(1);
  }, [productSearch, productItemsPerPage]);

  // Reset to page 1 if items per page changes
  useEffect(() => {
    setProductCurrentPage(1);
  }, [productItemsPerPage]);

  const [editingProduct, setEditingProduct] = useState<ExtendedProduct | null>(null);
  // Filter & Pagination State
  const [variantSearch, setVariantSearch] = useState("");
  const [variantCategoryFilter, setVariantCategoryFilter] = useState("ALL");
  const [variantCurrentPage, setVariantCurrentPage] = useState(1);
  const [variantItemsPerPage, setVariantItemsPerPage] = useState(5);
  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*, product_variations(*)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProducts(data as ExtendedProduct[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const flatVariantsList = useMemo(() => {
    return products.flatMap((product) =>
      (product.product_variations || []).map((v) => ({
        ...v,
        parentName: product.name,
        parentCategory: product.category,
      }))
    );
  }, [products]);

  const filteredVariants = useMemo(() => {
    return flatVariantsList.filter((v) => {
      const matchesSearch =
        v.specification.toLowerCase().includes(variantSearch.toLowerCase()) ||
        v.id_number.toLowerCase().includes(variantSearch.toLowerCase()) ||
        v.parentName.toLowerCase().includes(variantSearch.toLowerCase()) ||
        (v.cas_number && v.cas_number.toLowerCase().includes(variantSearch.toLowerCase()));

      const matchesCategory =
        variantCategoryFilter === "ALL" || v.parentCategory === variantCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [flatVariantsList, variantSearch, variantCategoryFilter]);
  const totalVariantPages = Math.ceil(filteredVariants.length / variantItemsPerPage) || 1;
  const paginatedVariants = useMemo(() => {
    const startIndex = (variantCurrentPage - 1) * variantItemsPerPage;
    return filteredVariants.slice(startIndex, startIndex + variantItemsPerPage);
  }, [filteredVariants, variantCurrentPage, variantItemsPerPage]);

  useEffect(() => {
    setVariantCurrentPage(1);
  }, [variantSearch, variantCategoryFilter, variantItemsPerPage]);
  const generateProductId = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const uploadImageToStorage = async (file: File, fileNamePrefix: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${fileNamePrefix}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
    if (!data?.publicUrl) throw new Error("Unable to generate public URL.");
    return data.publicUrl;
  };
  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };
  const handleVariantImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const updated = [...variants];
    updated[index] = {
      ...updated[index],
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
    };
    setVariants(updated);
  };
  const handleAddVariantRow = () => {
    setVariants([
      ...variants,
      {
        id_number: `VAR-${Date.now()}-${variants.length + 1}`,
        cas_number: "",
        specification: "",
        price: parseFloat(price) || 0,
        quantity: 0,
        stock: 0,
        img: "",
        imageFile: null,
        imagePreview: "",
      },
    ]);
  };
  const handleRemoveFormVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };
  const handleVariantFormChange = (index: number, field: keyof DatabaseVariant, val: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: val };
    setVariants(updated);
  };

  const handleCreateOrUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter a product name.");
      return;
    }
    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      alert("Please enter a valid price.");
      return;
    }
    try {
      setUploadingImage(true);

      // ---------------------------------------------------------
      const productId = editingProduct
        ? editingProduct.id
        : generateProductId(name);

      // ---------------------------------------------------------
      // 2. Generate / preserve UUID
      // ---------------------------------------------------------

      const productUuid =
        editingProduct?.uuid_id || crypto.randomUUID();

      // ---------------------------------------------------------
      // 3. Upload main product image if changed
      // ---------------------------------------------------------

      let mainImageUrl = editingProduct?.img || "";

      if (imageFile) {
        mainImageUrl = await uploadImageToStorage(
          imageFile,
          `product-${productId}`
        );
      }

      // ---------------------------------------------------------
      // 4. Prepare product payload
      // ---------------------------------------------------------

      const productPayload = {
        id: productId,
        uuid_id: productUuid,

        name: name.trim(),
        tag: tag.trim() || null,

        price: numericPrice,

        img: mainImageUrl || null,

        accent,
        category,

        summary: summary.trim() || null,
        description: description.trim() || null,

        slug: generateProductId(name),

        // Keep these fields safe if they are not being managed
        // through the form.
        specs: editingProduct?.specs ?? null,
        stack: editingProduct?.stack ?? null,
        stock: editingProduct?.stock ?? 0,
        variants: editingProduct?.product_variations ?? null,
      };

      // ---------------------------------------------------------
      // 5. INSERT or UPDATE product
      // ---------------------------------------------------------

      if (editingProduct) {
        const { error: productError } = await supabase
          .from("products")
          .update({
            name: productPayload.name,
            // uuid_id:productPayload.uuid,
            tag: productPayload.tag,
            price: productPayload.price,
            img: productPayload.img,
            accent: productPayload.accent,
            category: productPayload.category,
            summary: productPayload.summary,
            description: productPayload.description,
            slug: productPayload.slug,
          })
          .eq("id", editingProduct.id);

        if (productError) {
          throw productError;
        }
      } else {
        const { error: productError } = await supabase
          .from("products")
          .insert([productPayload]);

        if (productError) {
          throw productError;
        }
      }

      // ---------------------------------------------------------
      // 6. Make sure we have the correct UUID from products
      // ---------------------------------------------------------

      const { data: savedProduct, error: savedProductError } =
        await supabase
          .from("products")
          .select("id, uuid_id")
          .eq("id", productId)
          .single();

      if (savedProductError) {
        throw savedProductError;
      }

      if (!savedProduct?.uuid_id) {
        throw new Error(
          "Product was saved, but products.uuid_id could not be found."
        );
      }

      const variationProductUuid = savedProduct.uuid_id;

      // ---------------------------------------------------------
      // 7. Determine which existing variations remain
      // ---------------------------------------------------------

      const existingVariationIds = (editingProduct?.product_variations || [])
        .map((v) => v.id)
        .filter(Boolean) as string[];

      const submittedExistingVariationIds = variants
        .map((v) => v.id)
        .filter(Boolean) as string[];

      // ---------------------------------------------------------
      // 8. Delete variations removed from the edit form
      // ---------------------------------------------------------

      const variationIdsToDelete = existingVariationIds.filter(
        (existingId) =>
          !submittedExistingVariationIds.includes(existingId)
      );

      if (variationIdsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("product_variations")
          .delete()
          .in("id", variationIdsToDelete);

        if (deleteError) {
          throw deleteError;
        }
      }

      // ---------------------------------------------------------
      // 9. INSERT / UPDATE variations
      // ---------------------------------------------------------

      for (let index = 0; index < variants.length; index++) {
        const v = variants[index];

        // Ignore completely empty rows
        if (!v.specification?.trim()) {
          continue;
        }

        // -------------------------------------------------------
        // Upload variation image if a new file was selected
        // -------------------------------------------------------

        let finalVariantImgUrl = v.img || null;

        if (v.imageFile) {
          finalVariantImgUrl = await uploadImageToStorage(
            v.imageFile,
            `variant-${productId}-${index}`
          );
        }

        // -------------------------------------------------------
        // Prepare variation payload
        // -------------------------------------------------------

        const variationPayload = {
          /*
           * THIS IS THE IMPORTANT FIX
           *
           * product_variations.product_id is UUID
           * so we use products.uuid_id here.
           */
          product_id: variationProductUuid,

          id_number:
            v.id_number?.trim() ||
            `SKU-${productId}-${Date.now()}-${index}`,

          cas_number:
            v.cas_number?.trim() || null,

          specification: v.specification.trim(),

          price: Number(v.price) || 0,

          quantity: Number(v.quantity) || 0,

          stock: Number(v.stock) || 0,

          img: finalVariantImgUrl,
        };

        // -------------------------------------------------------
        // UPDATE existing variation
        // -------------------------------------------------------

        if (v.id) {
          const { error: updateVariationError } = await supabase
            .from("product_variations")
            .update(variationPayload)
            .eq("id", v.id);

          if (updateVariationError) {
            throw updateVariationError;
          }
        }

        // -------------------------------------------------------
        // INSERT new variation
        // -------------------------------------------------------

        else {
          const { error: insertVariationError } = await supabase
            .from("product_variations")
            .insert([
              variationPayload,
            ]);

          if (insertVariationError) {
            throw insertVariationError;
          }
        }
      }

      // ---------------------------------------------------------
      // 10. Refresh UI
      // ---------------------------------------------------------

      setIsModalOpen(false);

      resetForm();

      await fetchProducts();

    } catch (error: any) {
      console.error("Failed to save product:", error);

      alert(
        error?.message ||
        error?.details ||
        "Failed to save product."
      );
    } finally {
      setUploadingImage(false);
    }
  };



  const handleUpdateVariantInline = async (
    variantId: string,
    field: keyof DatabaseVariant,
    value: any
  ) => {
    let updateValue = value;

    if (field === "price") {
      updateValue = Number(value);
    }

    if (field === "stock" || field === "quantity") {
      updateValue = Number.parseInt(value, 10) || 0;
    }

    const { error } = await supabase
      .from("product_variations")
      .update({
        [field]: updateValue,
      })
      .eq("id", variantId);

    if (error) {
      console.error("Variant update error:", error);
      alert("Failed to update variant: " + error.message);
      return;
    }

    await fetchProducts();
  };


  const handleDeleteVariantInline = async (variantId: string) => {
    if (!confirm("Delete this variant from database?")) return;
    const { error } = await supabase
      .from("product_variations")
      .delete()
      .eq("id", variantId);

    if (error) {
      alert("Failed to delete variant: " + error.message);
    } else {
      fetchProducts();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Delete this entire product? All linked variations will be removed automatically via CASCADE.")) {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) alert("Error deleting product: " + error.message);
      fetchProducts();
    }
  };

  const openEditModal = (product: ExtendedProduct) => {
    setEditingProduct(product);

    setName(product.name || "");
    setTag(product.tag || "");
    setPrice(String(product.price ?? ""));
    setImagePreview(product.img || "");
    setImageFile(null);
    setAccent((product.accent as "blue" | "green") || "blue");
    setCategory((product.category as "Injectables" | "Oral" | "Peptides") || "Peptides");
    setSummary(product.summary || "");
    setDescription(product.description || "");

    if (product.product_variations && product.product_variations.length > 0) {
      setVariants(
        product.product_variations.map((v) => ({
          ...v,
          img: v.img || "",
          imagePreview: v.img || "",
          imageFile: null,
        }))
      );
    } else {
      setVariants([
        {
          id_number: `VAR-${product.uuid_id}-1`,
          cas_number: "",
          specification: "Standard",
          price: product.price || 0,
          quantity: 0,
          stock: 0,
          img: "",
          imagePreview: "",
          imageFile: null,
        },
      ]);
    }

    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setName("");
    setTag("");
    setPrice("");
    setImageFile(null);
    setImagePreview("");
    setAccent("blue");
    setCategory("Peptides");
    setSummary("");
    setDescription("");
    setVariants([
      {
        id_number: "",
        cas_number: "",
        specification: "5mg Vial",
        price: 0,
        quantity: 0,
        stock: 100,
        img: "",
        imageFile: null,
        imagePreview: "",
      },
    ]);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="font-sans text-xs font-bold uppercase tracking-widest text-[rgb(43_90_143)]">
            Catalogue Management
          </span>
          <h1 className="mt-1 font-sans text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Inventory Dashboard
          </h1>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="rounded-xl bg-[rgb(43_90_143)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-opacity hover:opacity-95"
        >
          + Add New Product
        </button>
      </div>

      {/* TABLE 1: MASTER PRODUCTS TABLE */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800">
            1. Master Products
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Product Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-64 rounded-xl border border-slate-200 bg-white px-3 py-1.5 pr-8 text-xs text-slate-700 shadow-sm focus:border-[rgb(43_90_143)] focus:outline-none"
              />

              {productSearch && (
                <button
                  type="button"
                  onClick={() => setProductSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 hover:text-slate-700"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            {/* Rows Per Page */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">
                Rows per page:
              </span>

              <select
                value={productItemsPerPage}
                onChange={(e) =>
                  setProductItemsPerPage(Number(e.target.value))
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm focus:border-[rgb(43_90_143)] focus:outline-none"
              >
                <option value={5}>5 Per Page</option>
                <option value={10}>10 Per Page</option>
                <option value={20}>20 Per Page</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 uppercase tracking-wider text-slate-400">
                  <th className="p-4 font-semibold">Image</th>
                  <th className="p-4 font-semibold">Name & ID</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">Base Price</th>
                  <th className="p-4 font-semibold">Variations Count</th>
                  <th className="p-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Loading catalogue...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="p-4">
                        {p.img ? (
                          <img
                            src={p.img}
                            alt={p.name}
                            className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-[9px] font-bold text-slate-400">
                            NO IMG
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        {p.name}
                        <div className="text-[10px] font-normal text-slate-400">
                          ID: {p.id}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-[rgb(43_90_143)]">
                        {p.category}
                      </td>
                      <td className="p-4 font-bold">
                        ${Number(p.price).toFixed(2)}
                      </td>
                      <td className="p-4 font-medium">
                        {p.product_variations?.length || 0} Variant(s)
                      </td>
                      <td className="p-4 text-right space-x-3">
                        <button
                          onClick={() => openEditModal(p)}
                          className="font-bold text-[rgb(43_90_143)] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="font-bold text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          {!loading && products.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
              <div>
                Showing {(productCurrentPage - 1) * productItemsPerPage + 1} to{" "}
                {Math.min(
                  productCurrentPage * productItemsPerPage,
                  products.length
                )}{" "}
                of {products.length} entries
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={productCurrentPage === 1}
                  onClick={() =>
                    setProductCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 shadow-sm disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                  Previous
                </button>
                <span className="font-bold text-slate-700">
                  Page {productCurrentPage} of {totalProductPages}
                </span>
                <button
                  disabled={productCurrentPage >= totalProductPages}
                  onClick={() =>
                    setProductCurrentPage((prev) =>
                      Math.min(prev + 1, totalProductPages)
                    )
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 shadow-sm disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TABLE 2: PRODUCT VARIATIONS TABLE */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800">2. Product Variations Table</h2>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Filter variants..."
              value={variantSearch}
              onChange={(e) => setVariantSearch(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm focus:border-[rgb(43_90_143)] focus:outline-none"
            />
            <select
              value={variantCategoryFilter}
              onChange={(e) => setVariantCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm focus:border-[rgb(43_90_143)] focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="Peptides">Peptides</option>
              <option value="Injectables">Injectables</option>
              <option value="Oral">Oral</option>
            </select>
            <select
              value={variantItemsPerPage}
              onChange={(e) => setVariantItemsPerPage(Number(e.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm focus:border-[rgb(43_90_143)] focus:outline-none"
            >
              <option value={5}>5 Per Page</option>
              <option value={10}>10 Per Page</option>
              <option value={20}>20 Per Page</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 uppercase tracking-wider text-slate-400">
                  <th className="p-4 font-semibold">Image</th>
                  <th className="p-4 font-semibold">Parent Product</th>
                  <th className="p-4 font-semibold">ID Number / CAS</th>
                  <th className="p-4 font-semibold">Specification</th>
                  <th className="p-4 font-semibold">Price ($)</th>
                  <th className="p-4 font-semibold">Stock</th>
                  <th className="p-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedVariants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No matching variations found.
                    </td>
                  </tr>
                ) : (
                  paginatedVariants.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80">
                      <td className="p-4">
                        {v.img ? (
                          <img src={v.img} alt={v.specification} className="h-10 w-10 rounded-md border border-slate-200 object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-[8px] font-bold text-slate-400">NO IMG</div>
                        )}
                      </td>
                      <td className="p-4 font-medium text-slate-500">
                        {v.parentName}
                        <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                          {v.parentCategory}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{v.id_number}</div>
                        {v.cas_number && <div className="text-[10px] text-slate-400">CAS: {v.cas_number}</div>}
                      </td>
                      <td className="p-4 font-bold text-slate-900">{v.specification}</td>
                      <td className="p-4">
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={v.price}
                          onBlur={(e) => handleUpdateVariantInline(v.id!, "price", parseFloat(e.target.value))}
                          className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="number"
                          defaultValue={v.stock || 0}
                          onBlur={(e) => handleUpdateVariantInline(v.id!, "stock", parseInt(e.target.value))}
                          className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteVariantInline(v.id!)}
                          className="font-bold text-red-500 hover:underline"
                        >
                          Delete Variant
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
            <div>
              Showing {filteredVariants.length === 0 ? 0 : (variantCurrentPage - 1) * variantItemsPerPage + 1} to{" "}
              {Math.min(variantCurrentPage * variantItemsPerPage, filteredVariants.length)} of{" "}
              {filteredVariants.length} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={variantCurrentPage === 1}
                onClick={() => setVariantCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 shadow-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="font-bold text-slate-700">
                Page {variantCurrentPage} of {totalVariantPages}
              </span>
              <button
                disabled={variantCurrentPage >= totalVariantPages}
                onClick={() => setVariantCurrentPage((prev) => Math.min(prev + 1, totalVariantPages))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 shadow-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* UNIFIED MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="my-8 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">
              {editingProduct ? "Edit Product & Variations" : "Add Product & Variations"}
            </h2>

            <form onSubmit={handleCreateOrUpdateProduct} className="mt-4 space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500">Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500">Tagline</label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500">Base Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500">Primary Product Image</label>
                <div className="mt-1 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {imagePreview && <img src={imagePreview} className="h-12 w-12 rounded-lg border object-cover" />}
                  <input type="file" accept="image/*" onChange={handleMainImageChange} className="text-xs text-slate-500" />
                </div>
              </div>

              {/* VARIATIONS SUB-FORM */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between pb-3">
                  <label className="block text-xs font-bold uppercase text-slate-700">Product Variations</label>
                  <button type="button" onClick={handleAddVariantRow} className="text-xs font-bold text-[rgb(43_90_143)] hover:underline">
                    + Add Variation
                  </button>
                </div>

                <div className="space-y-3">
                  {variants.map((v, idx) => (
                    <div key={v.id || idx} className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          placeholder="ID Number (e.g., VAR-101)"
                          value={v.id_number || ""}
                          onChange={(e) => handleVariantFormChange(idx, "id_number", e.target.value)}
                          className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Specification (e.g., 5mg Vial)"
                          value={v.specification || ""}
                          onChange={(e) => handleVariantFormChange(idx, "specification", e.target.value)}
                          className="flex-1 min-w-[120px] rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          value={v.price ?? 0}
                          onChange={(e) => handleVariantFormChange(idx, "price", e.target.value)}
                          className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                        />
                        <input
                          type="number"
                          placeholder="Stock"
                          value={v.stock ?? 0}
                          onChange={(e) => handleVariantFormChange(idx, "stock", e.target.value)}
                          className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                        />
                        <button type="button" onClick={() => handleRemoveFormVariant(idx)} className="px-2 font-bold text-red-500">
                          ×
                        </button>
                      </div>

                      {/* VARIANT IMAGE UPLOADER */}
                      <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/80 p-2">
                        {v.imagePreview ? (
                          <img src={v.imagePreview} alt="Variant Preview" className="h-9 w-9 rounded-md border object-cover" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-[9px] font-bold text-slate-400">
                            NO IMG
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleVariantImageChange(idx, e)}
                          className="text-xs text-slate-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold uppercase text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="rounded-xl bg-[rgb(43_90_143)] px-5 py-2 text-xs font-bold uppercase text-white shadow-sm hover:opacity-90 disabled:opacity-50"
                >
                  {uploadingImage ? "Saving..." : "Save Product & Variations"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}