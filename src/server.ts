import app from "./app";
import RabbitMqListener from "./services/RabbitMqListener";
app.listen(3002, () => {
    console.log("users API started on port 3002!");
    new RabbitMqListener().listeners();
});
