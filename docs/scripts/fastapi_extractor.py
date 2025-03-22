#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Extrator de informações do código FastAPI para referência e integração
Este script analisa o código-fonte da API FastAPI e gera um arquivo JSON com todas as informações relevantes.
"""

import os
import sys
import json
import ast
import re
import inspect
import importlib.util
import datetime
from typing import Dict, List, Any, Optional, Set, Tuple

# Configurações
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = "fastapi_reference.json"
EXTENSIONS_TO_PARSE = [".py", ".json", ".md", ".txt"]
DIRECTORIES_TO_SKIP = ["__pycache__", "venv", ".pytest_cache", ".git", "node_modules"]

# Estrutura principal
reference_doc = {
    "project": "fastapi-api",
    "version": "1.0.0",
    "createdAt": datetime.datetime.now().strftime("%Y-%m-%d"),
    "description": "Documentação completa da API FastAPI para referência e integração",
    "structure": {
        "routes": {},
        "models": {},
        "services": {},
        "config": {},
        "utils": {},
    },
    "files": []
}

class FastAPIAnalyzer:
    """Analisador de código Python para extrair informações de uma API FastAPI"""
    
    def __init__(self):
        self.imports = {}
        self.routes = []
        self.models = []
        self.dependencies = []
        self.functions = []
        self.classes = []
        
    def extract_info_from_file(self, file_path: str) -> Dict[str, Any]:
        """Extrai informações de um arquivo Python"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        file_info = {
            "path": os.path.relpath(file_path, ROOT_DIR),
            "size": os.path.getsize(file_path),
            "extension": os.path.splitext(file_path)[1],
            "modifiedAt": datetime.datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat(),
            "type": self.get_file_type(file_path)
        }
        
        if file_path.endswith('.py'):
            try:
                self.imports = {}
                self.routes = []
                self.models = []
                self.dependencies = []
                self.functions = []
                self.classes = []
                
                # Analisar o código usando AST
                tree = ast.parse(content)
                self.extract_imports(tree)
                self.extract_classes(tree)
                self.extract_functions(tree)
                self.extract_fastapi_routes(tree, content)
                
                # Adicionar informações extraídas
                file_info["imports"] = self.imports
                file_info["routes"] = self.routes
                file_info["models"] = self.models
                file_info["functions"] = self.functions
                file_info["classes"] = self.classes
            except SyntaxError as e:
                file_info["error"] = f"Erro de sintaxe: {str(e)}"
        
        elif file_path.endswith('.json'):
            try:
                json_data = json.loads(content)
                file_info["jsonSummary"] = self.summarize_json(json_data)
            except json.JSONDecodeError:
                file_info["error"] = "Falha ao analisar JSON"
        
        elif file_path.endswith('.md'):
            file_info["mdSummary"] = self.summarize_markdown(content)
            
        return file_info
    
    def get_file_type(self, file_path: str) -> str:
        """Determina o tipo de arquivo com base no caminho e nome"""
        rel_path = os.path.relpath(file_path, ROOT_DIR)
        basename = os.path.basename(file_path)
        
        if file_path.endswith('.py'):
            if 'routes' in rel_path or 'endpoints' in rel_path:
                return "route"
            if 'models' in rel_path or 'schemas' in rel_path:
                return "model"
            if 'services' in rel_path:
                return "service"
            if 'utils' in rel_path:
                return "utility"
            if 'middleware' in rel_path:
                return "middleware"
            if 'config' in rel_path or basename in ['config.py', 'settings.py']:
                return "config"
            if 'main.py' in basename:
                return "main"
            return "python"
        
        if file_path.endswith('.json'):
            if basename in ['config.json', 'settings.json']:
                return "config"
            return "data"
        
        if file_path.endswith('.md'):
            return "documentation"
        
        return "other"
    
    def extract_imports(self, tree: ast.AST) -> None:
        """Extrai declarações de importação"""
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for name in node.names:
                    self.imports[name.name] = {"asname": name.asname or name.name}
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ""
                for name in node.names:
                    full_name = f"{module}.{name.name}" if module else name.name
                    self.imports[full_name] = {
                        "module": module,
                        "name": name.name,
                        "asname": name.asname or name.name
                    }
    
    def extract_classes(self, tree: ast.AST) -> None:
        """Extrai definições de classes"""
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                base_names = []
                for base in node.bases:
                    if isinstance(base, ast.Name):
                        base_names.append(base.id)
                    elif isinstance(base, ast.Attribute):
                        base_names.append(f"{self._get_attribute_path(base)}")
                
                methods = []
                for item in node.body:
                    if isinstance(item, ast.FunctionDef):
                        args = self._extract_function_args(item)
                        methods.append({
                            "name": item.name,
                            "args": args,
                            "is_async": isinstance(item, ast.AsyncFunctionDef),
                            "decorators": self._extract_decorators(item)
                        })
                
                # Detectar se é um modelo Pydantic
                is_pydantic_model = "BaseModel" in base_names
                
                class_info = {
                    "name": node.name,
                    "bases": base_names,
                    "methods": methods,
                    "is_pydantic_model": is_pydantic_model
                }
                
                self.classes.append(class_info)
                
                # Se for um modelo Pydantic, adicionar à lista de modelos
                if is_pydantic_model:
                    fields = []
                    for item in node.body:
                        if isinstance(item, ast.AnnAssign) and isinstance(item.target, ast.Name):
                            field_type = self._get_type_annotation(item.annotation)
                            default_value = None
                            if item.value:
                                if isinstance(item.value, ast.Constant):
                                    default_value = item.value.value
                                else:
                                    default_value = ast.unparse(item.value)
                                    
                            fields.append({
                                "name": item.target.id,
                                "type": field_type,
                                "default": default_value
                            })
                    
                    self.models.append({
                        "name": node.name,
                        "fields": fields
                    })
    
    def extract_functions(self, tree: ast.AST) -> None:
        """Extrai definições de funções"""
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.parent_field != 'body':
                # Ignorar métodos de classe (já tratados em extract_classes)
                if not hasattr(node, 'parent_node') or not isinstance(node.parent_node, ast.ClassDef):
                    args = self._extract_function_args(node)
                    decorators = self._extract_decorators(node)
                    
                    func_info = {
                        "name": node.name,
                        "args": args,
                        "is_async": isinstance(node, ast.AsyncFunctionDef),
                        "decorators": decorators
                    }
                    
                    self.functions.append(func_info)
                    
                    # Verificar se é uma dependência do FastAPI
                    if any(d.get('name') == 'Depends' for d in decorators):
                        self.dependencies.append(func_info)
    
    def extract_fastapi_routes(self, tree: ast.AST, content: str) -> None:
        """Extrai rotas do FastAPI"""
        router_vars = self._find_router_variables(tree)
        
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                decorators = self._extract_decorators(node)
                
                http_methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head']
                route_info = None
                
                for decorator in decorators:
                    dec_name = decorator.get('name', '')
                    if dec_name.lower() in http_methods:
                        # É uma rota direta do app (app.get, app.post, etc.)
                        route_info = {
                            "path": self._extract_route_path(decorator),
                            "method": dec_name.upper(),
                            "function": node.name,
                            "is_async": isinstance(node, ast.AsyncFunctionDef),
                            "parameters": self._extract_function_args(node),
                            "response_model": self._extract_response_model(decorator),
                            "tags": self._extract_tags(decorator),
                            "summary": self._extract_docstring_field(node, "summary"),
                            "description": self._extract_docstring(node)
                        }
                    elif dec_name.endswith('router'):
                        # É uma rota de um router (router.get, router.post, etc.)
                        method = decorator.get('method', '')
                        if method.lower() in http_methods:
                            route_info = {
                                "path": self._extract_route_path(decorator),
                                "method": method.upper(),
                                "function": node.name,
                                "is_async": isinstance(node, ast.AsyncFunctionDef),
                                "parameters": self._extract_function_args(node),
                                "response_model": self._extract_response_model(decorator),
                                "tags": self._extract_tags(decorator),
                                "summary": self._extract_docstring_field(node, "summary"),
                                "description": self._extract_docstring(node)
                            }
                
                if route_info:
                    self.routes.append(route_info)
    
    def _find_router_variables(self, tree: ast.AST) -> List[str]:
        """Encontra variáveis que são instâncias de APIRouter"""
        routers = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name) and isinstance(node.value, ast.Call):
                        if isinstance(node.value.func, ast.Name) and node.value.func.id == 'APIRouter':
                            routers.append(target.id)
                        elif isinstance(node.value.func, ast.Attribute) and node.value.func.attr == 'APIRouter':
                            routers.append(target.id)
        return routers
    
    def _extract_function_args(self, node: ast.FunctionDef) -> List[Dict[str, Any]]:
        """Extrai argumentos de uma função"""
        args = []
        for arg in node.args.args:
            arg_info = {"name": arg.arg}
            if arg.annotation:
                arg_info["type"] = self._get_type_annotation(arg.annotation)
            args.append(arg_info)
        
        # Verifica kwargs
        if node.args.kwarg:
            args.append({
                "name": node.args.kwarg.arg,
                "type": "kwargs",
                "is_kwargs": True
            })
            
        return args
    
    def _extract_decorators(self, node: ast.FunctionDef) -> List[Dict[str, Any]]:
        """Extrai decoradores de uma função"""
        decorators = []
        for decorator in node.decorator_list:
            if isinstance(decorator, ast.Call) and isinstance(decorator.func, ast.Name):
                # Simples decorator como @app.get()
                dec_info = {
                    "name": decorator.func.id,
                    "args": self._extract_call_args(decorator)
                }
                decorators.append(dec_info)
            elif isinstance(decorator, ast.Call) and isinstance(decorator.func, ast.Attribute):
                # Decorator como @router.get()
                if hasattr(decorator.func, 'value') and hasattr(decorator.func.value, 'id'):
                    dec_info = {
                        "name": f"{decorator.func.value.id}.{decorator.func.attr}",
                        "method": decorator.func.attr,
                        "args": self._extract_call_args(decorator)
                    }
                    decorators.append(dec_info)
            elif isinstance(decorator, ast.Name):
                # Simples decorator como @decorator_nome
                decorators.append({"name": decorator.id})
            elif isinstance(decorator, ast.Attribute):
                # Decorator como @pacote.decorador
                decorators.append({"name": self._get_attribute_path(decorator)})
        return decorators
    
    def _extract_call_args(self, call_node: ast.Call) -> Dict[str, Any]:
        """Extrai argumentos de uma chamada de função"""
        args = {}
        
        # Processar argumentos posicionais
        for i, arg in enumerate(call_node.args):
            if isinstance(arg, ast.Constant):
                args[f"arg{i}"] = arg.value
            else:
                args[f"arg{i}"] = ast.unparse(arg)
        
        # Processar argumentos nomeados
        for keyword in call_node.keywords:
            if isinstance(keyword.value, ast.Constant):
                args[keyword.arg] = keyword.value.value
            elif isinstance(keyword.value, ast.Name):
                args[keyword.arg] = keyword.value.id
            elif isinstance(keyword.value, ast.List):
                args[keyword.arg] = [
                    (elt.value if isinstance(elt, ast.Constant) else ast.unparse(elt))
                    for elt in keyword.value.elts
                ]
            else:
                args[keyword.arg] = ast.unparse(keyword.value)
                
        return args
    
    def _extract_route_path(self, decorator: Dict[str, Any]) -> str:
        """Extrai o caminho da rota de um decorador"""
        args = decorator.get('args', {})
        # O primeiro argumento posicional geralmente é o caminho
        if 'arg0' in args:
            return args['arg0']
        # Ou pode ser um argumento nomeado
        if 'path' in args:
            return args['path']
        return ""
    
    def _extract_response_model(self, decorator: Dict[str, Any]) -> Optional[str]:
        """Extrai o modelo de resposta de um decorador"""
        args = decorator.get('args', {})
        if 'response_model' in args:
            return args['response_model']
        return None
    
    def _extract_tags(self, decorator: Dict[str, Any]) -> List[str]:
        """Extrai as tags de um decorador"""
        args = decorator.get('args', {})
        if 'tags' in args:
            if isinstance(args['tags'], list):
                return args['tags']
            return [args['tags']]
        return []
    
    def _extract_docstring(self, node: ast.FunctionDef) -> Optional[str]:
        """Extrai a docstring de uma função"""
        if node.body and isinstance(node.body[0], ast.Expr) and isinstance(node.body[0].value, ast.Constant):
            return node.body[0].value.value
        return None
    
    def _extract_docstring_field(self, node: ast.FunctionDef, field: str) -> Optional[str]:
        """Extrai um campo específico da docstring"""
        docstring = self._extract_docstring(node)
        if not docstring:
            return None
        
        # Procurar pelo campo no formato ":campo: valor"
        pattern = rf":{field}:\s*(.+?)(?:$|\n)"
        match = re.search(pattern, docstring, re.MULTILINE)
        if match:
            return match.group(1).strip()
        return None
    
    def _get_attribute_path(self, node: ast.Attribute) -> str:
        """Constrói o caminho completo de um atributo"""
        if isinstance(node.value, ast.Name):
            return f"{node.value.id}.{node.attr}"
        elif isinstance(node.value, ast.Attribute):
            return f"{self._get_attribute_path(node.value)}.{node.attr}"
        else:
            return node.attr
    
    def _get_type_annotation(self, annotation: ast.AST) -> str:
        """Converte uma anotação de tipo em string"""
        if isinstance(annotation, ast.Name):
            return annotation.id
        elif isinstance(annotation, ast.Attribute):
            return self._get_attribute_path(annotation)
        elif isinstance(annotation, ast.Subscript):
            # Lidar com tipos genéricos como List[str], Dict[str, int]
            if isinstance(annotation.value, ast.Name):
                container = annotation.value.id
                if hasattr(annotation.slice, 'value'):  # Python 3.8
                    slice_value = self._get_type_annotation(annotation.slice.value)
                else:  # Python 3.9+
                    slice_value = self._get_type_annotation(annotation.slice)
                return f"{container}[{slice_value}]"
            return ast.unparse(annotation)
        elif hasattr(ast, 'Constant') and isinstance(annotation, ast.Constant):
            return str(annotation.value)
        else:
            try:
                return ast.unparse(annotation)
            except:
                return str(type(annotation).__name__)
    
    def summarize_json(self, json_data: Any) -> Dict[str, Any]:
        """Resumo simplificado de dados JSON"""
        if isinstance(json_data, dict):
            keys = list(json_data.keys())
            return {
                "keys": keys,
                "size": len(json.dumps(json_data)),
                "topLevelItemCount": len(keys),
                "topLevelStructure": {
                    key: self._describe_value(json_data[key]) for key in keys
                }
            }
        elif isinstance(json_data, list):
            return {
                "type": "array",
                "itemCount": len(json_data),
                "sample": [self._describe_value(item) for item in json_data[:3]]
            }
        else:
            return {"type": type(json_data).__name__, "value": json_data}
    
    def _describe_value(self, value: Any) -> str:
        """Descreve um valor de forma concisa"""
        if value is None:
            return "null"
        elif isinstance(value, list):
            return f"Array({len(value)})"
        elif isinstance(value, dict):
            return f"Object({len(value)} props)"
        else:
            return type(value).__name__
    
    def summarize_markdown(self, content: str) -> Dict[str, Any]:
        """Resumo simplificado de arquivo Markdown"""
        headings = []
        for line in content.split('\n'):
            heading_match = re.match(r'^(#{1,6})\s+(.+)$', line)
            if heading_match:
                headings.append({
                    "level": len(heading_match.group(1)),
                    "text": heading_match.group(2).strip()
                })
        
        return {
            "headings": headings,
            "charCount": len(content),
            "lineCount": content.count('\n') + 1
        }


def find_all_files(dir_path: str, extensions_to_parse: List[str], dirs_to_skip: List[str]) -> List[str]:
    """Encontra todos os arquivos com as extensões especificadas"""
    all_files = []
    
    try:
        for root, dirs, files in os.walk(dir_path):
            # Pular diretórios da lista de exclusão
            dirs[:] = [d for d in dirs if d not in dirs_to_skip]
            
            for file in files:
                if any(file.endswith(ext) for ext in extensions_to_parse):
                    all_files.append(os.path.join(root, file))
    except Exception as e:
        print(f"⚠️ Erro ao listar arquivos em {dir_path}: {str(e)}")
    
    return all_files


def get_directory_structure(dir_path: str, dirs_to_skip: List[str]) -> Dict[str, Any]:
    """Obtém a estrutura básica de diretórios"""
    result = {}
    
    try:
        items = os.listdir(dir_path)
        for item in items:
            if item in dirs_to_skip:
                continue
            
            item_path = os.path.join(dir_path, item)
            if os.path.isdir(item_path):
                result[item] = get_directory_structure(item_path, dirs_to_skip)
    except Exception as e:
        print(f"⚠️ Erro ao ler o diretório {dir_path}: {str(e)}")
    
    return result


def categorize_file(file_info: Dict[str, Any]) -> None:
    """Categoriza um arquivo com base no tipo"""
    file_path = file_info["path"]
    file_type = file_info.get("type", "")
    
    if file_type == "route":
        reference_doc["structure"]["routes"][file_path] = file_info
    elif file_type == "model":
        reference_doc["structure"]["models"][file_path] = file_info
    elif file_type == "service":
        reference_doc["structure"]["services"][file_path] = file_info
    elif file_type in ["config", "main"]:
        reference_doc["structure"]["config"][file_path] = file_info
    elif file_type == "utility":
        reference_doc["structure"]["utils"][file_path] = file_info


def main():
    """Função principal que executa o script"""
    print(f"📁 Analisando diretório: {ROOT_DIR}")
    
    # Obter a estrutura básica de diretórios
    file_structure = get_directory_structure(ROOT_DIR, DIRECTORIES_TO_SKIP)
    reference_doc["fileStructure"] = file_structure
    
    # Encontrar todos os arquivos relevantes
    all_files = find_all_files(ROOT_DIR, EXTENSIONS_TO_PARSE, DIRECTORIES_TO_SKIP)
    print(f"🔍 Encontrados {len(all_files)} arquivos para analisar")
    
    # Inicializar o analisador
    analyzer = FastAPIAnalyzer()
    
    # Processar cada arquivo
    for file_path in all_files:
        try:
            print(f"🔍 Analisando arquivo: {os.path.relpath(file_path, ROOT_DIR)}")
            file_info = analyzer.extract_info_from_file(file_path)
            
            # Categorizar o arquivo
            categorize_file(file_info)
            
            # Adicionar à lista de arquivos
            reference_doc["files"].append(file_info)
        except Exception as e:
            print(f"❌ Erro ao processar arquivo {file_path}: {str(e)}")
    
    # Salvar o documento de referência
    with open(os.path.join(ROOT_DIR, OUTPUT_FILE), 'w', encoding='utf-8') as f:
        json.dump(reference_doc, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Documento de referência salvo em {OUTPUT_FILE}")


if __name__ == "__main__":
    # Adicionar atributos para facilitar a análise AST
    for node in ast.walk(ast.parse("")):
        node.parent_node = None
        node.parent_field = None
        node.parent_field_index = None
    
    def _fix_missing_locations(node):
        for child in ast.iter_child_nodes(node):
            child.parent_node = node
            for field, value in ast.iter_fields(node):
                if child in value if isinstance(value, list) else child == value:
                    child.parent_field = field
                    if isinstance(value, list):
                        child.parent_field_index = value.index(child)
            _fix_missing_locations(child)
    
    original_parse = ast.parse
    def parse_wrapper(*args, **kwargs):
        tree = original_parse(*args, **kwargs)
        _fix_missing_locations(tree)
        return tree
    ast.parse = parse_wrapper
    
    try:
        main()
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        sys.exit(1) 