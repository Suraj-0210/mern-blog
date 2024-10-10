import { useEffect, useState } from "react";
import { RestaurantSidebar } from "../components/RestaurantSidebar";
import { Spinner } from "flowbite-react";
import { useNavigate } from "react-router-dom";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { app } from "../firebase";
import { MenuCards } from "../components/MenuCards";
import { AddDish } from "../components/AddDish";

export const RestaurantMenus = (props) => {
  const restaurant = props.restaurant;
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [createRestaurantSuccess, setCreateRestaurantSuccess] = useState("");
  const [isAddNew, setIsAddNew] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/menu/${restaurant._id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await res.json();
      setMenu(data);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  const onChangeHandler = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value.trim(),
      restaurantid: restaurant._id,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setCreateRestaurantSuccess(null);

    if (
      !formData.name ||
      !formData.description ||
      !formData.price ||
      !formData.image
    ) {
      return setErrorMessage("Please fill out all fields");
    }

    try {
      setFormLoading(true);
      const res = await fetch("/api/menu/createRecepie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success === false) {
        setFormLoading(false);
        return setErrorMessage(data.message);
      }
      setFormLoading(false);
      if (res.ok) {
        navigate(0);
        handleClickAddNew();
      }
    } catch (error) {
      setErrorMessage(error.message);
      setFormLoading(false);
    }
  };

  const handleClickAddNew = () => {
    setIsAddNew((prevState) => !prevState);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  useEffect(() => {
    if (imageFile) {
      uploadImage();
    }
  }, [imageFile]);

  const uploadImage = async () => {
    const storage = getStorage(app);
    const fileName = new Date().getTime() + imageFile.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, imageFile);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Error uploading image:", error);
        setErrorMessage("Error uploading image");
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setFormData((prev) => ({ ...prev, image: downloadURL }));
        });
      }
    );
  };

  return (
    <div className="flex flex-col md:flex-row justify-between gap-6">
      <div className="h-full mb-10">
        <RestaurantSidebar restaurant={restaurant} />
      </div>

      <div className="flex-1 justify-center mx-4 my-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" className="text-indigo-600" />
          </div>
        ) : !isAddNew && menu.length ? (
          <MenuCards
            menu={menu}
            isAddNew={isAddNew}
            handleClickAddNew={handleClickAddNew}
          />
        ) : (
          <AddDish
            menu={menu}
            handleSubmit={handleSubmit}
            onChangeHandler={onChangeHandler}
            handleImageChange={handleImageChange}
            uploadProgress={uploadProgress}
            formLoading={formLoading}
            createRestaurantSuccess={createRestaurantSuccess}
            errorMessage={errorMessage}
          />
        )}
      </div>
    </div>
  );
};
