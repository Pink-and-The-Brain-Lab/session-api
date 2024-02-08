import app from "./app";
import RabbitListener from "./services/RabbitListener";
app.listen(3002, () => {
    console.log("users API started on port 3002!");
    new RabbitListener().listeners();
});
