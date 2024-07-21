# Exercism Helper (aka) `exer`

### Note
This project has only been tested to work in a linux environment (Ubuntu & Termux)

## Installing
1. Install the official [Exercism CLI](https://exercism.org/docs/using/solving-exercises/working-locally)
2. Add the [token](https://exercism.org/docs/using/solving-exercises/working-locally#h-configuration) to the cli config
3. Install `Nodejs` and `npm`
4. Clone this project with git:
```shell
git clone https://github.com/Giveback007/exercism-helper.git
```

## Project Prep
1. CD into 'exercism-helper' directory (this project)
2. Install dependencies with `npm` or `pnpm`
```shell
pnpm i
```
3. Make the project executable:
```shell
cd bin && chmod +x exer
```
1. Make the bin folder accessible anywhere, by adding this folders bin your .bashrc
```shell
nano ~/.bashrc
```
add this line to .bashrc
```bash
export PATH=$PATH:/path/to/exercism-helper/bin
```
1. Run the script anywhere in the terminal with:
```shell
exer
```






