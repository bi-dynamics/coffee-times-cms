"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { schemas, Category } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, addDoc, collection, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { ImageUpload } from "./image-upload";

interface ListingFormProps {
  category: Category;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
  id?: string;
}

export function ListingForm({ category, initialData, id }: ListingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const schema = schemas[category];

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || {
      title: "",
      description: "",
      town: "",
      suburb: "",
      status: "draft",
      images: [],
      phone_number: "",
      email_address: "",
      website: "",
      ...(category === "accomodations"
        ? { bedrooms: 0, bathrooms: 0, features: [] }
        : {}),
      ...(category === "accounting" ||
      category === "beauty" ||
      category === "cleaning_services" ||
      category === "electrical_devices" ||
      category === "furniture_and_repairs" ||
      category === "it_services" ||
      category === "legal_services" ||
      category === "mechanical_services" ||
      category === "plumbing"
        ? { services: [] }
        : {}),
      ...(category === "cleaning_services" ? { note: "" } : {}),
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(values: any) {
    setLoading(true);
    try {
      if (id) {
        await updateDoc(doc(db, category, id), values);
        toast.success("Listing updated successfully");
      } else {
        await addDoc(collection(db, category), {
          ...values,
          createdAt: new Date(),
        });
        toast.success("Listing created successfully");
      }
      router.push(`/categories/${category}`);
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error("Error saving listing:", error);
      toast.error("Failed to save listing");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <Card className="border-zinc-800 bg-zinc-900 shadow-xl">
              <CardHeader>
                <CardTitle className="text-zinc-100">
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }: { field: any }) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <FormItem>
                      <FormLabel className="text-zinc-400">Title</FormLabel>
                      <FormControl>
                        <Input
                          className="border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus:border-red-500 focus:ring-red-500"
                          placeholder="Store Name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }: { field: any }) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <FormItem>
                      <FormLabel className="text-zinc-400">
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-30 border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus:border-red-500 focus:ring-red-500"
                          placeholder="Tell us about this business..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="town"
                    render={({ field }: { field: any }) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                      <FormItem>
                        <FormLabel className="text-zinc-400">Town</FormLabel>
                        <FormControl>
                          <Input
                            className="border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="suburb"
                    render={({ field }: { field: any }) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                      <FormItem>
                        <FormLabel className="text-zinc-400">Suburb</FormLabel>
                        <FormControl>
                          <Input
                            className="border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900 shadow-xl">
              <CardHeader>
                <CardTitle className="text-zinc-100">Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }: { field: any }) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <FormItem>
                      <FormLabel className="text-zinc-400">
                        Phone Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email_address"
                  render={({ field }: { field: any }) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <FormItem>
                      <FormLabel className="text-zinc-400">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          className="border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }: { field: any }) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <FormItem>
                      <FormLabel className="text-zinc-400">
                        Website URL
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-zinc-800 bg-zinc-900 shadow-xl">
              <CardHeader>
                <CardTitle className="text-zinc-100">
                  Listing Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }: { field: any }) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-800 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-zinc-200">
                          Active Status
                        </FormLabel>
                        <FormDescription className="text-zinc-500">
                          Make this listing visible to the public.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value === "active"}
                          onCheckedChange={(checked) =>
                            field.onChange(checked ? "active" : "draft")
                          }
                          className="data-[state=checked]:bg-red-600"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {category === "accomodations" && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bedrooms"
                      render={({ field }: { field: any }) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                        <FormItem>
                          <FormLabel className="text-zinc-400">
                            Bedrooms
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="border-zinc-800 bg-zinc-950 text-zinc-100"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bathrooms"
                      render={({ field }: { field: any }) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                        <FormItem>
                          <FormLabel className="text-zinc-400">
                            Bathrooms
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="border-zinc-800 bg-zinc-950 text-zinc-100"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {form.getValues("services") !== undefined && (
                  <FormField
                    control={form.control}
                    name="services"
                    render={({ field }: { field: any }) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                      <FormItem>
                        <FormLabel className="text-zinc-400">
                          Services
                        </FormLabel>
                        <div className="space-y-2">
                          {field.value.map((service: string, index: number) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={service}
                                className="border-zinc-800 bg-zinc-950 text-zinc-100"
                                onChange={(e) => {
                                  const newServices = [...field.value];
                                  newServices[index] = e.target.value;
                                  field.onChange(newServices);
                                }}
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() =>
                                  field.onChange(
                                    field.value.filter(
                                      (_: any, i: number) => i !== index // eslint-disable-line @typescript-eslint/no-explicit-any
                                    )
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => field.onChange([...field.value, ""])}
                            className="w-full border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
                          >
                            <Plus className="mr-2 h-4 w-4" /> Add Service
                          </Button>
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                {category === "cleaning_services" && (
                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }: { field: any }) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                      <FormItem>
                        <FormLabel className="text-zinc-400">Note</FormLabel>
                        <FormControl>
                          <Textarea
                            className="border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900 shadow-xl">
              <CardHeader>
                <CardTitle className="text-zinc-100">Images</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }: { field: any }) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <FormItem>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={(urls: string[]) => field.onChange(urls)}
                          onRemove={(url: string) =>
                            field.onChange(
                              field.value.filter((u: string) => u !== url)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 border-t border-zinc-800 pt-8">
          <Button
            type="button"
            variant="ghost"
            className="text-zinc-400 hover:text-white hover:bg-zinc-900"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-red-600 text-white hover:bg-red-700 min-w-[120px]"
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {id ? "Update Listing" : "Create Listing"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
